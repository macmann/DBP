import { getBody, getHeading, getItems, getString, type SectionRenderProps } from "@/components/landing/types";

export function FeaturesSection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const items = getItems(section);

  return (
    <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <div className="space-y-2">
        {heading ? <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{heading}</h2> : null}
        {body ? <p className="text-neutral-600">{body}</p> : null}
      </div>
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article key={`${section.id}-feature-${index}`} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <h3 className="font-semibold text-neutral-900">{getString(item, "title") ?? `Feature ${index + 1}`}</h3>
              <p className="mt-2 text-sm text-neutral-600">{getString(item, "description") ?? "Details unavailable."}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">Feature list unavailable.</div>
      )}
    </section>
  );
}
