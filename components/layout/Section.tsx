import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("section-spacing", className)} {...props} />;
}
