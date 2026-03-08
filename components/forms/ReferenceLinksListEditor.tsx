"use client";

import { useMemo, useState } from "react";
import { isValidReferenceUrl } from "@/lib/validation/page";

type ReferenceLinksListEditorProps = {
  initialLinks: string[];
  error?: string;
  rowErrors?: Record<number, string>;
};

export function ReferenceLinksListEditor({
  initialLinks,
  error,
  rowErrors,
}: ReferenceLinksListEditorProps) {
  const [links, setLinks] = useState<string[]>(initialLinks.length ? initialLinks : [""]);

  const clientRowErrors = useMemo(() => {
    const errors: Record<number, string> = {};
    links.forEach((link, index) => {
      const trimmed = link.trim();
      if (trimmed && !isValidReferenceUrl(trimmed)) {
        errors[index] = "Must be a valid http(s) URL.";
      }
    });
    return errors;
  }, [links]);

  const mergedErrors = rowErrors ?? clientRowErrors;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-900">Reference links</p>
        <p className="text-sm text-neutral-600">
          Add one or more http(s) links to source material used for this page.
        </p>
      </div>

      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={`${index}-${link}`} className="space-y-1">
            <div className="flex items-start gap-2">
              <input
                value={link}
                onChange={(event) => {
                  const next = [...links];
                  next[index] = event.target.value;
                  setLinks(next);
                }}
                placeholder="https://example.com/reference"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
              />
              <input type="hidden" name="referenceLinks" value={link.trim()} />
              <button
                type="button"
                onClick={() =>
                  setLinks((current) =>
                    current.length === 1 ? [""] : current.filter((_, i) => i !== index),
                  )
                }
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Remove
              </button>
            </div>
            {mergedErrors[index] ? <p className="text-sm text-red-700">Row {index + 1}: {mergedErrors[index]}</p> : null}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLinks((current) => [...current, ""])}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Add link
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
