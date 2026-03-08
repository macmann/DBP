import { AssetGrid } from "@/components/assets/AssetGrid";
import type { UploadedAssetDto } from "@/types/asset-upload";

type AssetPreviewGalleryProps = {
  assets: UploadedAssetDto[];
  removingAssetId: string | null;
  onMoveUp: (assetId: string) => void;
  onMoveDown: (assetId: string) => void;
  onRemove: (assetId: string) => void;
};

export function AssetPreviewGallery({
  assets,
  removingAssetId,
  onMoveUp,
  onMoveDown,
  onRemove,
}: AssetPreviewGalleryProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-neutral-900">Asset preview gallery</h3>
      <AssetGrid
        assets={assets}
        removingAssetId={removingAssetId}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRemove={onRemove}
      />
    </section>
  );
}
