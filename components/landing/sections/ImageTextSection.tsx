import { getBody, getHeading, resolveMediaAssets, type SectionRenderProps } from "@/components/landing/types";

export function ImageTextSection({ section, resolveAsset }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const image = resolveMediaAssets(section, resolveAsset).find((asset) => asset.mimeType.startsWith("image/"));

  return (
    <section className="grid gap-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 md:grid-cols-2 md:items-center">
      <div className="space-y-3">
        {heading ? <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{heading}</h2> : null}
        {body ? <p className="text-neutral-700">{body}</p> : null}
        {!heading && !body ? <p className="text-sm text-neutral-600">Text content unavailable.</p> : null}
      </div>
      {image ? (
        <img src={image.storageUrl} alt={image.fileName} className="h-64 w-full rounded-xl object-cover" />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-600">Image unavailable.</div>
      )}
    </section>
  );
}
