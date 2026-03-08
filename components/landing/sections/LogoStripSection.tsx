import { resolveMediaAssets, type SectionRenderProps } from "@/components/landing/types";

export function LogoStripSection({ section, resolveAsset }: SectionRenderProps) {
  const logos = resolveMediaAssets(section, resolveAsset).filter((asset) => asset.mimeType.startsWith("image/"));

  if (logos.length === 0) {
    return <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">No logos available.</div>;
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {logos.map((logo) => (
          <div key={logo.id} className="flex items-center justify-center rounded-lg border border-neutral-100 p-4">
            <img src={logo.storageUrl} alt={logo.fileName} className="h-10 w-full object-contain" />
          </div>
        ))}
      </div>
    </section>
  );
}
