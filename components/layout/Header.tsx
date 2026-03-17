import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/config/brand";

export function Header() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold">
          {PRODUCT_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-neutral-700 hover:text-neutral-900" href="/insights">
            Insights
          </Link>
        </nav>
      </div>
    </header>
  );
}
