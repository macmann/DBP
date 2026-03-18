import { cn } from "@/lib/utils/cn";

type ContainerWidth = "default" | "content" | "prose";

const widthClasses: Record<ContainerWidth, string> = {
  default: "max-w-container",
  content: "max-w-content",
  prose: "max-w-prose"
};

export function Container({
  className,
  width = "default",
  padded = true,
  children
}: {
  className?: string;
  width?: ContainerWidth;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto w-full", widthClasses[width], padded && "px-4", className)}>{children}</div>;
}
