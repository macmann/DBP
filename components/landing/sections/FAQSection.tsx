import { getItems, getString, type SectionRenderProps } from "@/components/landing/types";

export function FAQSection({ section }: SectionRenderProps) {
  const items = getItems(section);

  if (items.length === 0) {
    return <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">FAQ content unavailable.</div>;
  }

  return (
    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      {items.map((item, index) => (
        <details key={`${section.id}-faq-${index}`} className="rounded-lg border border-neutral-100 p-4">
          <summary className="cursor-pointer font-medium text-neutral-900">{getString(item, "question") ?? `Question ${index + 1}`}</summary>
          <p className="mt-2 text-sm text-neutral-700">{getString(item, "answer") ?? "Answer unavailable."}</p>
        </details>
      ))}
    </section>
  );
}
