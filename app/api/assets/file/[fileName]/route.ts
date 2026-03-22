export const runtime = "nodejs";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const DEFAULT_ASSET_STORAGE_LOCAL_DIR = "public/uploads/assets";

function getAssetStorageDir() {
  return process.env.ASSET_STORAGE_LOCAL_DIR ?? DEFAULT_ASSET_STORAGE_LOCAL_DIR;
}

function sanitizeRequestedName(rawName: string): string | null {
  const fileName = rawName.trim();
  if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    return null;
  }

  return fileName;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName: rawFileName } = await params;
  const fileName = sanitizeRequestedName(rawFileName);

  if (!fileName) {
    return NextResponse.json({ ok: false, error: "Invalid file path." }, { status: 400 });
  }

  const targetPath = path.resolve(process.cwd(), getAssetStorageDir(), fileName);

  try {
    const fileBuffer = await readFile(targetPath);
    const contentType = fileName.endsWith(".svg") ? "image/svg+xml" : undefined;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
  }
}
