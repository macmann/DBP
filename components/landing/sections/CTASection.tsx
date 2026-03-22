import {
  getBody,
  getCta,
  getHeading,
  getLayoutVariant,
  type SectionRenderProps,
} from "@/components/landing/types";
import { SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function CTASection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const cta = getCta(section);
  const layoutVariant = getLayoutVariant(section);
  const isSplit = layoutVariant === "split";

  return (
    <SectionShell tone="inverted" className={isSplit ? "" : "text-center"}>
      <div className={isSplit ? "grid gap-6 md:grid-cols-[2fr_auto] md:items-center" : "mx-auto max-w-3xl space-y-6"}>
        <SectionHeader
          heading={heading ?? "Ready to get started?"}
          body={body}
          align={isSplit ? "left" : "center"}
          bodyClassName={`${isSplit ? "" : "mx-auto"} text-white/85`.trim()}
        />
        {cta ? (
          <a
            href={cta.href}
            className={`inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--dbp-ink)] transition hover:opacity-90 ${isSplit ? "md:justify-self-end" : ""}`.trim()}
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
