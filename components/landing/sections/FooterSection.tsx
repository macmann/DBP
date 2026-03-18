import { getBody, getHeading, type SectionRenderProps } from "@/components/landing/types";
import { SectionHeader, SectionShell } from "@/components/landing/sections/shared";

export function FooterSection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);

  return (
    <SectionShell className="py-8 text-center">
      <SectionHeader
        heading={heading ?? "Thanks for visiting"}
        body={body ?? "Update this footer with legal text, links, or your company address."}
        align="center"
        headingClassName="text-lg text-neutral-900 sm:text-xl"
        bodyClassName="mx-auto text-neutral-600"
      />
    </SectionShell>
  );
}
