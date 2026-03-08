import { getBody, getCta, getHeading, type SectionRenderProps } from "@/components/landing/types";

export function CTASection({ section }: SectionRenderProps) {
  const heading = getHeading(section);
  const body = getBody(section);
  const cta = getCta(section);

  return (
    <section className="rounded-2xl bg-neutral-900 px-6 py-10 text-center text-white sm:px-8 sm:py-12">
      {heading ? <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2> : <p className="text-lg font-semibold">Ready to get started?</p>}
      {body ? <p className="mx-auto mt-3 max-w-2xl text-neutral-200">{body}</p> : null}
      {cta ? (
        <a href={cta.href} className="mt-6 inline-flex rounded-md bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">
          {cta.label}
        </a>
      ) : (
        <p className="mt-4 text-sm text-neutral-300">Action link unavailable.</p>
      )}
    </section>
  );
}
