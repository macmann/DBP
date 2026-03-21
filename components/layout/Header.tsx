import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PRODUCT_NAME, PRODUCT_SHORT_NAME } from "@/lib/config/brand";

export function Header() {
  return (
    <header className="border-b border-border bg-surface-elevated">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-fg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold tracking-wide text-primary-foreground">
            {PRODUCT_SHORT_NAME}
          </span>
          <span className="text-lg font-bold tracking-tight sm:text-xl">{PRODUCT_NAME}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link className="text-muted hover:text-fg" href="/insights">
            Insights
          </Link>
        </nav>
      </Container>
    </header>
  );
}
