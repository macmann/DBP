import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm md:p-6">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-fg md:text-lg">{title}</h2>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
