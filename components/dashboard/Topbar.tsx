import Link from "next/link";

type Breadcrumb = {
  label: string;
  href?: string;
};

type TopbarAction = {
  label: string;
  href: string;
};

type TopbarProps = {
  title: string;
  breadcrumbs: Breadcrumb[];
  action?: TopbarAction;
};

export function Topbar({ title, breadcrumbs, action }: TopbarProps) {
  return (
    <header className="border-b border-border bg-surface-elevated/95 px-4 py-4 backdrop-blur sm:px-6 md:px-8 md:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted sm:text-sm sm:normal-case sm:tracking-normal">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden>›</span> : null}
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="hover:text-fg">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-fg" : undefined}>{crumb.label}</span>
                  )}
                </div>
              );
            })}
          </nav>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl md:text-3xl">{title}</h1>
        </div>

        {action ? (
          <Link
            href={action.href}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 sm:w-auto"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
