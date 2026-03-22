import {
  getBody,
  getHeading,
  getItems,
  getString,
  type SectionRenderProps,
} from "@/components/landing/types";
import { EmptyState, SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function FeaturesSection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const items = getItems(section).filter(
    (item) => getString(item, "title") || getString(item, "description"),
  );

  return (
    <SectionShell>
      <div className="space-y-8">
        <SectionHeader
          heading={heading ?? "Core features"}
          body={body}
        />
        {items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <article
                key={`${section.id}-feature-${index}`}
                className="rounded-2xl border border-[var(--dbp-border)] bg-[var(--dbp-surface-muted)] p-5"
              >
                <h3 className="text-base font-semibold text-[var(--dbp-ink)]">
                  {getString(item, "title") ?? `Feature ${index + 1}`}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--dbp-muted)]">
                  {getString(item, "description") ??
                    "Additional feature details can be added here."}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="Feature list unavailable." />
        )}
      </div>
    </SectionShell>
  );
}
