export const ALLOWED_ASSET_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "application/zip"
] as const;

export type AllowedAssetMimeType = (typeof ALLOWED_ASSET_MIME_TYPES)[number];

export type UploadAssetErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "CONFIGURATION_ERROR"
  | "NOT_FOUND"
  | "UPLOAD_FAILED"
  | "INTERNAL_ERROR";

export type UploadAssetErrorDto = {
  ok: false;
  error: {
    code: UploadAssetErrorCode;
    message: string;
    field?: string;
  };
};

export type UploadedAssetDto = {
  id: string;
  projectId: string;
  pageId: string | null;
  type: string;
  sortOrder: number;
  fileName: string;
  mimeType: string;
  storageUrl: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type UploadAssetSuccessDto = {
  ok: true;
  asset: UploadedAssetDto;
};

export type UploadAssetResponseDto = UploadAssetSuccessDto | UploadAssetErrorDto;
