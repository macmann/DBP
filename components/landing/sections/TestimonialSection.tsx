import {
  getBody,
  getHeading,
  getItems,
  getLayoutVariant,
  getString,
  type SectionRenderProps,
} from "@/components/landing/types";
import { EmptyState, SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function TestimonialSection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const layoutVariant = getLayoutVariant(section);
  const items = getItems(section).filter(
    (item) => getString(item, "quote") || getString(item, "author"),
  );
  const gridClassName =
    layoutVariant === "cards-3" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2";

  return (
    <SectionShell>
      <div className="space-y-8">
        <SectionHeader
          heading={heading ?? "What customers are saying"}
          body={body}
        />
        {items.length > 0 ? (
          <div className={`grid gap-4 ${gridClassName}`}>
            {items.map((item, index) => (
              <blockquote
                key={`${section.id}-testimonial-${index}`}
                className="rounded-2xl border border-[var(--dbp-border)] bg-[var(--dbp-surface-muted)] p-6"
              >
                <p className="text-sm leading-7 text-[var(--dbp-muted)]">
                  “{getString(item, "quote") ?? "No quote provided."}”
                </p>
                <footer className="mt-4 text-sm font-semibold text-[var(--dbp-ink)]">
                  {getString(item, "author") ?? "Anonymous"}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <EmptyState message="Testimonials unavailable." />
        )}
      </div>
    </SectionShell>
  );
}
