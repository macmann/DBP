"use client";

import type { UploadedAssetDto } from "@/types/asset-upload";
import { AssetPreviewCard } from "@/components/assets/AssetPreviewCard";

type AssetGridProps = {
  assets: UploadedAssetDto[];
  removingAssetId: string | null;
  onMoveUp: (assetId: string) => void;
  onMoveDown: (assetId: string) => void;
  onRemove: (assetId: string) => void;
};

export function AssetGrid({ assets, removingAssetId, onMoveUp, onMoveDown, onRemove }: AssetGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset, index) => (
        <AssetPreviewCard
          key={asset.id}
          asset={asset}
          canMoveUp={index > 0}
          canMoveDown={index < assets.length - 1}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
          isRemoving={removingAssetId === asset.id}
        />
      ))}
    </div>
  );
}
