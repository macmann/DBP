export const runtime = "nodejs";

import { AssetType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImageDimensions } from "@/lib/storage/getImageDimensions";
import { StorageConfigurationError, uploadAsset } from "@/lib/storage/uploadAsset";
import {
  ALLOWED_ASSET_MIME_TYPES,
  type UploadAssetErrorCode,
  type UploadAssetResponseDto,
  type UploadedAssetDto
} from "@/types/asset-upload";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function errorResponse(status: number, code: UploadAssetErrorCode, message: string, field?: string) {
  return NextResponse.json<UploadAssetResponseDto>(
    {
      ok: false,
      error: { code, message, field }
    },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const projectId = String(formData.get("projectId") ?? "").trim();
    const pageIdRaw = String(formData.get("pageId") ?? "").trim();
    const pageId = pageIdRaw || null;
    const type = String(formData.get("type") ?? "").trim();
    const file = formData.get("file");

    if (!projectId) {
      return errorResponse(400, "VALIDATION_ERROR", "Project is required.", "projectId");
    }

    if (!Object.values(AssetType).includes(type as AssetType)) {
      return errorResponse(400, "VALIDATION_ERROR", "Asset type is invalid.", "type");
    }

    if (!(file instanceof File)) {
      return errorResponse(400, "VALIDATION_ERROR", "Please choose a file to upload.", "file");
    }

    if (file.size <= 0) {
      return errorResponse(400, "VALIDATION_ERROR", "Selected file is empty.", "file");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse(400, "VALIDATION_ERROR", "File is too large. Maximum size is 10MB.", "file");
    }

    if (!ALLOWED_ASSET_MIME_TYPES.includes(file.type as (typeof ALLOWED_ASSET_MIME_TYPES)[number])) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "Unsupported file type. Please upload PNG, JPEG, WEBP, GIF, SVG, PDF, TXT, or ZIP files.",
        "file"
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      return errorResponse(404, "NOT_FOUND", "Project was not found.", "projectId");
    }

    if (pageId) {
      const page = await prisma.page.findFirst({
        where: { id: pageId, projectId },
        select: { id: true }
      });

      if (!page) {
        return errorResponse(404, "NOT_FOUND", "Page was not found for this project.", "pageId");
      }
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const dimensions = getImageDimensions(file.type, fileBytes);

    const uploaded = await uploadAsset(file);
    const metadata = {
      sizeBytes: file.size,
      ...(dimensions
        ? {
            width: dimensions.width,
            height: dimensions.height
          }
        : {})
    };

    const aggregate = await prisma.asset.aggregate({
      where: {
        projectId,
        pageId
      },
      _max: {
        sortOrder: true
      }
    });

    const asset = await prisma.asset.create({
      data: {
        projectId,
        pageId,
        type: type as AssetType,
        sortOrder: (aggregate._max.sortOrder ?? -1) + 1,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        storageUrl: uploaded.storageUrl,
        metadata
      }
    });

    const dto: UploadedAssetDto = {
      id: asset.id,
      projectId: asset.projectId,
      pageId: asset.pageId,
      type: asset.type,
      sortOrder: asset.sortOrder,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      storageUrl: asset.storageUrl,
      metadata: (asset.metadata as Record<string, unknown> | null) ?? null,
      createdAt: asset.createdAt.toISOString()
    };

    return NextResponse.json<UploadAssetResponseDto>({ ok: true, asset: dto }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return errorResponse(500, "CONFIGURATION_ERROR", "Uploads are unavailable. Please contact support.");
    }

    console.error("Failed to upload asset", error);
    return errorResponse(500, "INTERNAL_ERROR", "Could not upload file right now. Please try again.");
  }
}
