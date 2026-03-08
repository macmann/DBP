import { cn } from "@/lib/utils/cn";

type PageStatus = "draft" | "generating" | "published" | "failed";

const statusClasses: Record<PageStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  generating: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700"
};

function isPageStatus(status: string): status is PageStatus {
  return status === "draft" || status === "generating" || status === "published" || status === "failed";
}

export function PageStatusBadge({ status }: { status: string }) {
  const safeStatus = isPageStatus(status) ? status : "draft";

  return <span className={cn("rounded-full px-3 py-1 text-xs font-medium capitalize", statusClasses[safeStatus])}>{status}</span>;
}
