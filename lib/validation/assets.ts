import { ALLOWED_ASSET_MIME_TYPES } from "@/types/asset-upload";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateAssetFile(file: File | null) {
  if (!file) {
    return "Please choose a file to upload.";
  }

  if (file.size <= 0) {
    return "Selected file is empty.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "File is too large. Maximum size is 10MB.";
  }

  if (!ALLOWED_ASSET_MIME_TYPES.includes(file.type as (typeof ALLOWED_ASSET_MIME_TYPES)[number])) {
    return "Unsupported file type. Please upload PNG, JPEG, WEBP, GIF, SVG, PDF, TXT, or ZIP files.";
  }

  return null;
}
