"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type PublicUrlActionsProps = {
  label?: string;
  path: string;
  compact?: boolean;
};

export function PublicUrlActions({ label = "Public URL", path, compact = false }: PublicUrlActionsProps) {
  const [copied, setCopied] = useState(false);

  const absoluteUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return path;
    }

    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }, [path]);

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Unable to copy public URL", { path, error });
      setCopied(false);
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3 rounded-xl border border-border bg-surface-elevated p-4"}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="break-all rounded-md bg-surface px-3 py-2 font-mono text-sm text-fg">
        {absoluteUrl}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copyPublicUrl}>
          {copied ? "Copied" : "Copy URL"}
        </Button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg hover:bg-secondary"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
}
