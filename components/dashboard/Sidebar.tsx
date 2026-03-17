"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCT_NAME } from "@/lib/config/brand";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/dashboard", label: "Dashboard", match: (pathname: string) => pathname === "/dashboard" },
  { href: "/projects", label: "Projects", match: (pathname: string) => pathname.startsWith("/projects") }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-neutral-200 bg-white md:w-64 md:flex-shrink-0 md:border-b-0 md:border-r">
      <div className="p-4 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{PRODUCT_NAME} workspace</p>
        <nav className="mt-4 flex gap-2 md:flex-col">
          {links.map((link) => {
            const isActive = link.match(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
