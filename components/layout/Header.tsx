import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PRODUCT_NAME } from "@/lib/config/brand";

export function Header() {
  return (
    <header className="border-b border-border bg-surface-elevated">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-fg">
          <Image
            src="https://i.ibb.co/tnKbnsn/atx.png"
            alt="Atenxion DBP logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover"
          />
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
