"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rollbackToVersion } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type VersionHistoryItem = {
  id: string;
  versionNumber: number;
  instructionPrompt: string | null;
  notes: string | null;
  createdAt: string;
  hasValidSchema: boolean;
};

type VersionHistoryPanelProps = {
  projectSlug: string;
  pageId: string;
  currentVersionId: string | null;
  versions: VersionHistoryItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function VersionHistoryPanel({
  projectSlug,
  pageId,
  currentVersionId,
  versions,
}: VersionHistoryPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Select a version to keep or rollback to.");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface-elevated p-6">
      <h2 className="text-lg font-semibold text-fg">Version history</h2>
      <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
        {status}
      </p>
      <ul className="space-y-3">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId;

          return (
            <li key={version.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fg">v{version.versionNumber}</p>
                  <p className="text-xs text-muted">{formatDate(version.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrent ? (
                    <Badge variant="success" className="px-2 py-1">
                      Current
                    </Badge>
                  ) : null}
                  <Button
                    type="button"
                    disabled={isPending || isCurrent || !version.hasValidSchema}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      startTransition(async () => {
                        setStatus(`Rolling back to v${version.versionNumber}...`);
                        const result = await rollbackToVersion(projectSlug, pageId, version.id);
                        setStatus(result.message);

                        if (result.status === "success") {
                          window.dispatchEvent(new Event("page-preview-updated"));
                          router.refresh();
                        }
                      });
                    }}
                  >
                    {isCurrent ? "Active" : version.hasValidSchema ? "Rollback" : "Invalid schema"}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-fg">
                {version.instructionPrompt?.trim() || "No instruction prompt captured for this version."}
              </p>
              <p className="mt-1 text-sm text-muted">
                {version.notes?.trim() || "No version notes available for this version."}
              </p>
              {!version.hasValidSchema ? (
                <p className="mt-2 text-xs font-medium text-warning">
                  Rollback unavailable: this version schema failed validation.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
