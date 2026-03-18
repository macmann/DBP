import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const baseControlClasses =
  "w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/20";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseControlClasses, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(baseControlClasses, className)} {...props} />;
}
