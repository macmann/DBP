import {
  getBody,
  getHeading,
  getItems,
  getString,
  type SectionRenderProps,
} from "@/components/landing/types";
import { EmptyState, SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function FAQSection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const items = getItems(section).filter(
    (item) => getString(item, "question") || getString(item, "answer"),
  );

  return (
    <SectionShell>
      <div className="space-y-8">
        <SectionHeader
          heading={heading ?? "Frequently asked questions"}
          body={body}
          headingClassName="text-neutral-900"
          bodyClassName="text-neutral-600"
        />
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <details
                key={`${section.id}-faq-${index}`}
                className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
              >
                <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-neutral-900 marker:content-none sm:text-base">
                  {getString(item, "question") ?? `Question ${index + 1}`}
                </summary>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {getString(item, "answer") ?? "Answer unavailable."}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <EmptyState message="FAQ content unavailable." />
        )}
      </div>
    </SectionShell>
  );
}
