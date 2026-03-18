"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/config/brand";
import { cn } from "@/lib/utils/cn";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overview and recent activity",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Manage projects and pages",
    match: (pathname: string) => pathname.startsWith("/projects"),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="border-b border-border bg-surface-elevated md:border-b-0 md:border-r">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 md:block">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{PRODUCT_NAME} workspace</p>
            <p className="text-sm font-medium text-fg">Navigation</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-controls="dashboard-nav"
          >
            {isOpen ? "Close" : "Menu"}
          </Button>
        </div>

        <nav id="dashboard-nav" className={cn("mt-4 hidden gap-2 md:flex md:flex-col", isOpen && "flex flex-col")}>
          {links.map((link) => {
            const isActive = link.match(pathname);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm transition",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-transparent text-fg hover:border-border hover:bg-secondary",
                )}
              >
                <p className="font-medium">{link.label}</p>
                <p className={cn("mt-0.5 text-xs", isActive ? "text-primary-foreground/80" : "text-muted")}>{link.description}</p>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
