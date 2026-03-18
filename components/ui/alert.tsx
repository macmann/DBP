import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type AlertVariant = "info" | "success" | "warning" | "danger";

const variantClasses: Record<AlertVariant, string> = {
  info: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger"
};

export function Alert({ className, variant = "info", ...props }: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return <div className={cn("rounded-lg border p-3 text-sm", variantClasses[variant], className)} role="alert" {...props} />;
}
