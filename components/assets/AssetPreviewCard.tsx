"use client";

import type { UploadedAssetDto } from "@/types/asset-upload";

const IMAGE_MIME_PREFIX = "image/";

function formatBytes(bytes: number | null) {
  if (bytes === null || Number.isNaN(bytes)) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

type AssetPreviewCardProps = {
  asset: UploadedAssetDto;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: (assetId: string) => void;
  onMoveDown: (assetId: string) => void;
  onRemove: (assetId: string) => void;
  isRemoving: boolean;
};

export function AssetPreviewCard({
  asset,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  isRemoving
}: AssetPreviewCardProps) {
  const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
  const sizeBytes = typeof metadata.sizeBytes === "number" ? metadata.sizeBytes : null;
  const isImage = asset.mimeType.startsWith(IMAGE_MIME_PREFIX);

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.storageUrl} alt={asset.fileName} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center px-4 text-center text-xs text-neutral-600">
            <p>File preview unavailable.</p>
            <a href={asset.storageUrl} target="_blank" rel="noreferrer" className="mt-2 text-neutral-900 underline">
              Open file
            </a>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="truncate text-sm font-medium text-neutral-900" title={asset.fileName}>
          {asset.fileName}
        </p>
        <p className="text-xs uppercase tracking-wide text-neutral-500">{asset.type}</p>
        <p className="text-xs text-neutral-600">{formatBytes(sizeBytes)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onMoveUp(asset.id)}
          disabled={!canMoveUp}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Move up
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(asset.id)}
          disabled={!canMoveDown}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Move down
        </button>
        <button
          type="button"
          onClick={() => onRemove(asset.id)}
          disabled={isRemoving}
          className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRemoving ? "Removing…" : "Remove"}
        </button>
      </div>
    </article>
  );
}
