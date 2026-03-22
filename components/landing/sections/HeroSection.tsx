import {
  getBody,
  getCta,
  getHeading,
  getLayoutVariant,
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
  const layoutVariant = getLayoutVariant(section);
  const heroImage = resolveMediaAssets(section, resolveAsset).find((asset) =>
    asset.mimeType.startsWith("image/"),
  );
  const isCentered = layoutVariant === "centered";
  const isStacked = layoutVariant === "stacked";
  const shouldSwapColumns = layoutVariant === "media-left";

  if (!heading && !body && !cta && !heroImage) {
    return <EmptyState message="Hero content unavailable." />;
  }

  return (
    <SectionShell tone="inverted" className="relative">
      <div
        className={[
          "grid gap-8",
          isCentered || isStacked ? "max-w-4xl mx-auto" : "lg:grid-cols-2 lg:items-center",
        ].join(" ")}
      >
        <div
          className={[
            "space-y-6",
            isCentered ? "text-center" : "",
            shouldSwapColumns && !isCentered && !isStacked ? "lg:order-2" : "",
          ].join(" ")}
        >
          <SectionHeader
            heading={heading ?? "Build trust with a clear value proposition"}
            body={body}
            headingClassName="sm:text-4xl"
            bodyClassName={`text-white/85 ${isCentered ? "mx-auto" : ""}`.trim()}
            align={isCentered ? "center" : "left"}
          />
          {cta ? (
            <a
              href={cta.href}
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--dbp-ink)] transition hover:opacity-90"
            >
              {cta.label}
            </a>
          ) : (
            <p className="text-sm text-white/75">
              Add a call-to-action to improve conversion focus.
            </p>
          )}
        </div>
        <MediaFrame
          src={heroImage?.storageUrl}
          alt={heroImage?.fileName}
          fallbackLabel="Add a hero image for stronger visual hierarchy."
          className="border-white/20 bg-black/20"
          aspectClassName="aspect-[4/3]"
          imageClassName={isCentered ? "object-contain p-2" : ""}
          fit={isCentered ? "contain" : "cover"}
        />
      </div>
    </SectionShell>
  );
}
