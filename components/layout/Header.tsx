import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PRODUCT_NAME } from "@/lib/config/brand";

export function Header() {
  return (
    <header className="border-b border-border bg-surface-elevated">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="text-sm font-semibold text-fg">
          {PRODUCT_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-muted hover:text-fg" href="/insights">
            Insights
          </Link>
        </nav>
      </Container>
    </header>
  );
}
