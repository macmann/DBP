import { getBody, getCta, getHeading, type SectionRenderProps } from "@/components/landing/types";
import { SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function CTASection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const cta = getCta(section);

  return (
    <SectionShell tone="inverted" className="text-center">
      <div className="mx-auto max-w-3xl space-y-6">
        <SectionHeader
          heading={heading ?? "Ready to get started?"}
          body={body}
          align="center"
          bodyClassName="mx-auto text-neutral-200"
        />
        {cta ? (
          <a
            href={cta.href}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
          >
            {cta.label}
          </a>
        ) : (
          <p className="text-sm text-neutral-300">Action link unavailable.</p>
        )}
      </div>
    </SectionShell>
  );
}
