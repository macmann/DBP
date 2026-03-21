import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type UploadAssetResult = {
  storageUrl: string;
  mimeType: string;
  fileName: string;
};

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

type LocalStorageConfig = {
  localDir: string;
  publicBaseUrl: string;
};

const DEFAULT_ASSET_STORAGE_LOCAL_DIR = "public/uploads/assets";
const DEFAULT_ASSET_PUBLIC_BASE_URL = "/uploads/assets/";

function getLocalStorageConfig(): LocalStorageConfig {
  const localDir = process.env.ASSET_STORAGE_LOCAL_DIR ?? DEFAULT_ASSET_STORAGE_LOCAL_DIR;
  const publicBaseUrl = process.env.ASSET_PUBLIC_BASE_URL ?? DEFAULT_ASSET_PUBLIC_BASE_URL;

  return { localDir, publicBaseUrl };
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export async function uploadAsset(file: File): Promise<UploadAssetResult> {
  const { localDir, publicBaseUrl } = getLocalStorageConfig();

  const extension = path.extname(file.name);
  const baseName = path.basename(file.name, extension);
  const safeFileName = `${sanitizeFileName(baseName)}-${randomUUID()}${extension.toLowerCase()}`;

  const targetDir = path.resolve(process.cwd(), localDir);
  const targetPath = path.join(targetDir, safeFileName);

  await mkdir(targetDir, { recursive: true });
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await writeFile(targetPath, fileBuffer);

  const normalizedPublicBaseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl : `${publicBaseUrl}/`;
  const storageUrl = /^https?:\/\//i.test(normalizedPublicBaseUrl)
    ? new URL(safeFileName, normalizedPublicBaseUrl).toString()
    : `${normalizedPublicBaseUrl.startsWith("/") ? normalizedPublicBaseUrl : `/${normalizedPublicBaseUrl}`}${safeFileName}`;

  return {
    storageUrl,
    mimeType: file.type,
    fileName: file.name
  };
}
