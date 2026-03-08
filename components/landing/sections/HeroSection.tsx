import { getBody, getCta, getHeading, resolveMediaAssets, type SectionRenderProps } from "@/components/landing/types";

export function HeroSection({ section, resolveAsset }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const cta = getCta(section);
  const heroImage = resolveMediaAssets(section, resolveAsset).find((asset) => asset.mimeType.startsWith("image/"));

  if (!heading && !body) {
    return <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">Hero content unavailable.</div>;
  }

  return (
    <section className="grid gap-6 rounded-2xl bg-neutral-900 px-6 py-12 text-white sm:px-8 lg:grid-cols-2 lg:items-center lg:px-12">
      <div className="space-y-4">
        {heading ? <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{heading}</h2> : null}
        {body ? <p className="text-base text-neutral-200 sm:text-lg">{body}</p> : null}
        {cta ? (
          <a href={cta.href} className="inline-flex rounded-md bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">
            {cta.label}
          </a>
        ) : null}
      </div>
      {heroImage ? (
        <img src={heroImage.storageUrl} alt={heroImage.fileName} className="h-64 w-full rounded-xl object-cover sm:h-72 lg:h-80" />
      ) : null}
    </section>
  );
}
