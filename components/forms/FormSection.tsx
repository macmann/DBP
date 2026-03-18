import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-neutral-900 md:text-lg">{title}</h2>
        {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
