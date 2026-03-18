import { Badge } from "@/components/ui/badge";

type PageStatus = "draft" | "generating" | "published" | "failed";

const statusVariants: Record<PageStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  generating: "warning",
  published: "success",
  failed: "danger"
};

function isPageStatus(status: string): status is PageStatus {
  return status === "draft" || status === "generating" || status === "published" || status === "failed";
}

export function PageStatusBadge({ status }: { status: string }) {
  const safeStatus = isPageStatus(status) ? status : "draft";

  return <Badge variant={statusVariants[safeStatus]} className="capitalize">{status}</Badge>;
}
