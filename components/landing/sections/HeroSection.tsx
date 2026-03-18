import {
  getBody,
  getCta,
  getHeading,
  resolveMediaAssets,
  type SectionRenderProps,
} from "@/components/landing/types";
import {
  EmptyState,
  MediaFrame,
  SectionHeader,
  SectionShell,
} from "@/components/landing/sections/shared";

export function HeroSection({ section, resolveAsset }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const cta = getCta(section);
  const heroImage = resolveMediaAssets(section, resolveAsset).find((asset) =>
    asset.mimeType.startsWith("image/"),
  );

  if (!heading && !body && !cta && !heroImage) {
    return <EmptyState message="Hero content unavailable." />;
  }

  return (
    <SectionShell tone="inverted" className="relative">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <SectionHeader
            heading={heading ?? "Build trust with a clear value proposition"}
            body={body}
            headingClassName="sm:text-4xl"
            bodyClassName="text-neutral-200"
          />
          {cta ? (
            <a
              href={cta.href}
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              {cta.label}
            </a>
          ) : (
            <p className="text-sm text-neutral-300">
              Add a call-to-action to improve conversion focus.
            </p>
          )}
        </div>
        <MediaFrame
          src={heroImage?.storageUrl}
          alt={heroImage?.fileName}
          fallbackLabel="Add a hero image for stronger visual hierarchy."
          className="border-white/10 bg-neutral-900"
          aspectClassName="aspect-[4/3]"
        />
      </div>
    </SectionShell>
  );
}
