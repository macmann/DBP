import { resolveMediaAssets, type SectionRenderProps } from "@/components/landing/types";

export function GallerySection({ section, resolveAsset }: SectionRenderProps) {
  const images = resolveMediaAssets(section, resolveAsset).filter((asset) => asset.mimeType.startsWith("image/"));

  if (images.length === 0) {
    return <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">Gallery is empty.</div>;
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <img key={image.id} src={image.storageUrl} alt={image.fileName} className="h-52 w-full rounded-xl object-cover sm:h-56 lg:h-60" />
      ))}
    </section>
  );
}
