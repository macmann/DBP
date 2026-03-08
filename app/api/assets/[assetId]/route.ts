export const runtime = "nodejs";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function tryResolveLocalPath(storageUrl: string) {
  const localDir = process.env.ASSET_STORAGE_LOCAL_DIR;

  if (!localDir) {
    return null;
  }

  try {
    const url = new URL(storageUrl);
    const fileName = path.basename(url.pathname);
    return path.resolve(process.cwd(), localDir, fileName);
  } catch {
    return null;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const { assetId } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        storageUrl: true
      }
    });

    if (!asset) {
      return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
    }

    const localPath = tryResolveLocalPath(asset.storageUrl);

    await prisma.asset.delete({
      where: {
        id: asset.id
      }
    });

    if (localPath) {
      await unlink(localPath).catch(() => undefined);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete asset", error);
    return NextResponse.json({ ok: false, error: "Could not delete asset." }, { status: 500 });
  }
}
