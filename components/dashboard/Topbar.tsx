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
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-4 md:px-8">
      <div className="space-y-2">
        <nav className="flex items-center gap-2 text-sm text-neutral-500">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span>/</span> : null}
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className="hover:text-neutral-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-medium text-neutral-700" : undefined}>{crumb.label}</span>
                )}
              </div>
            );
          })}
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">{title}</h1>
      </div>

      {action ? (
        <Link href={action.href} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}
