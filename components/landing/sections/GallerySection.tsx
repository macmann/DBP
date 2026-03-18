import { resolveMediaAssets, type SectionRenderProps } from "@/components/landing/types";
import { EmptyState, MediaFrame, SectionShell } from "@/components/landing/sections/shared";

export function GallerySection({ section, resolveAsset }: SectionRenderProps) {
  const images = resolveMediaAssets(section, resolveAsset).filter((asset) =>
    asset.mimeType.startsWith("image/"),
  );

  if (images.length === 0) {
    return <EmptyState message="Gallery is empty." />;
  }

  return (
    <SectionShell>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <MediaFrame
            key={image.id}
            src={image.storageUrl}
            alt={image.fileName}
            fallbackLabel="Image unavailable"
            aspectClassName="aspect-[4/3]"
          />
        ))}
      </div>
    </SectionShell>
  );
}
