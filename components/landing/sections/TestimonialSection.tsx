import { getItems, getString, type SectionRenderProps } from "@/components/landing/types";

export function TestimonialSection({ section }: SectionRenderProps) {
  const items = getItems(section);

  if (items.length === 0) {
    return <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">Testimonials unavailable.</div>;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <blockquote key={`${section.id}-testimonial-${index}`} className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-neutral-700">“{getString(item, "quote") ?? "No quote provided."}”</p>
          <footer className="mt-4 text-sm font-semibold text-neutral-900">{getString(item, "author") ?? "Anonymous"}</footer>
        </blockquote>
      ))}
    </section>
  );
}
