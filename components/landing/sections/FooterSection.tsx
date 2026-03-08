import { getBody, getHeading, type SectionRenderProps } from "@/components/landing/types";

export function FooterSection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);

  return (
    <footer className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center sm:px-8">
      {heading ? <h2 className="text-lg font-semibold text-neutral-900">{heading}</h2> : null}
      {body ? <p className="mt-2 text-sm text-neutral-600">{body}</p> : <p className="text-sm text-neutral-500">Footer content unavailable.</p>}
    </footer>
  );
}
