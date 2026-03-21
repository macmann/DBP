import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PRODUCT_NAME } from "@/lib/config/brand";

export function Header() {
  return (
    <header className="border-b border-border bg-surface-elevated">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-fg sm:text-2xl">
          {PRODUCT_NAME}
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
