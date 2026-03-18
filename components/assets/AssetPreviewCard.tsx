"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.storageUrl} alt={asset.fileName} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center px-4 text-center text-xs text-muted">
            <p>File preview unavailable.</p>
            <a href={asset.storageUrl} target="_blank" rel="noreferrer" className="mt-2 text-fg underline">
              Open file
            </a>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="truncate text-sm font-medium text-fg" title={asset.fileName}>
          {asset.fileName}
        </p>
        <p className="text-xs uppercase tracking-wide text-muted">{asset.type}</p>
        <p className="text-xs text-muted">{formatBytes(sizeBytes)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => onMoveUp(asset.id)} disabled={!canMoveUp} variant="outline" size="sm">
          Move up
        </Button>
        <Button onClick={() => onMoveDown(asset.id)} disabled={!canMoveDown} variant="outline" size="sm">
          Move down
        </Button>
        <Button onClick={() => onRemove(asset.id)} disabled={isRemoving} variant="danger" size="sm">
          {isRemoving ? "Removing…" : "Remove"}
        </Button>
      </div>
    </Card>
  );
}
