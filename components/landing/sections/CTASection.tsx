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
          bodyClassName="mx-auto text-white/85"
        />
        {cta ? (
          <a
            href={cta.href}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--dbp-ink)] transition hover:opacity-90"
          >
            {cta.label}
          </a>
        ) : (
          <p className="text-sm text-white/75">Action link unavailable.</p>
        )}
      </div>
    </SectionShell>
  );
}
