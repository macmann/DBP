import { resolveMediaAssets, type SectionRenderProps } from "@/components/landing/types";
import { EmptyState, MediaFrame, SectionShell } from "@/components/landing/sections/shared";

export function LogoStripSection({ section, resolveAsset }: SectionRenderProps) {
  const logos = resolveMediaAssets(section, resolveAsset).filter((asset) =>
    asset.mimeType.startsWith("image/"),
  );

  if (logos.length === 0) {
    return <EmptyState message="No logos available." />;
  }

  return (
    <SectionShell className="py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {logos.map((logo) => (
          <MediaFrame
            key={logo.id}
            src={logo.storageUrl}
            alt={logo.fileName}
            fit="contain"
            aspectClassName="aspect-[5/3]"
            className="bg-white p-4"
            fallbackLabel="Logo unavailable"
          />
        ))}
      </div>
    </SectionShell>
  );
}
