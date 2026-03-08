import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
