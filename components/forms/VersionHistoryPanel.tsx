"use client";

import { useState, useTransition } from "react";
import { rollbackToVersion } from "@/app/actions";

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
  const [status, setStatus] = useState<string>("Select a version to keep or rollback to.");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Version history</h2>
      <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
        {status}
      </p>
      <ul className="space-y-3">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId;

          return (
            <li key={version.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">v{version.versionNumber}</p>
                  <p className="text-xs text-neutral-500">{formatDate(version.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrent ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      Current
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={isPending || isCurrent || !version.hasValidSchema}
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                    onClick={() => {
                      startTransition(async () => {
                        setStatus(`Rolling back to v${version.versionNumber}...`);
                        const result = await rollbackToVersion(projectSlug, pageId, version.id);
                        setStatus(result.message);

                        if (result.status === "success") {
                          window.dispatchEvent(new Event("page-preview-updated"));
                        }
                      });
                    }}
                  >
                    {isCurrent ? "Active" : version.hasValidSchema ? "Rollback" : "Invalid schema"}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-neutral-700">
                {version.instructionPrompt?.trim() || "No instruction prompt captured for this version."}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {version.notes?.trim() || "No version notes available for this version."}
              </p>
              {!version.hasValidSchema ? (
                <p className="mt-2 text-xs font-medium text-amber-700">
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
