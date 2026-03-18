"use client";

import { useMemo, useState } from "react";

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
    <div className={compact ? "space-y-2" : "space-y-3 rounded-xl border border-neutral-200 bg-white p-4"}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="break-all rounded-md bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-800">
        {absoluteUrl}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          onClick={copyPublicUrl}
        >
          {copied ? "Copied" : "Copy URL"}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
}
