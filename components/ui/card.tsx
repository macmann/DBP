import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn("rounded-xl border border-border bg-surface-elevated p-4 shadow-sm", className)} {...props} />;
}
