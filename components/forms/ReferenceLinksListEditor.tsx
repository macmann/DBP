"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidReferenceUrl } from "@/lib/validation/page";
import { cn } from "@/lib/utils/cn";

type ReferenceLinksListEditorProps = {
  initialLinks: string[];
  error?: string;
  rowErrors?: Record<number, string>;
  disabled?: boolean;
};

export function ReferenceLinksListEditor({
  initialLinks,
  error,
  rowErrors,
  disabled,
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
        <p className="text-sm font-medium text-fg">Reference links</p>
        <p className="text-xs text-muted">Add one or more http(s) links to source material used for this page.</p>
      </div>

      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={`${index}-${link}`} className="space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                value={link}
                disabled={disabled}
                onChange={(event) => {
                  const next = [...links];
                  next[index] = event.target.value;
                  setLinks(next);
                }}
                placeholder="https://example.com/reference"
                aria-invalid={Boolean(mergedErrors[index])}
                className={cn(
                  mergedErrors[index] ? "border-danger/60 focus-visible:ring-danger/20" : undefined,
                )}
              />
              <input type="hidden" name="referenceLinks" value={link.trim()} />
              <Button
                type="button"
                disabled={disabled}
                variant="outline"
                onClick={() =>
                  setLinks((current) =>
                    current.length === 1 ? [""] : current.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
            {mergedErrors[index] ? <p className="text-sm text-danger">Row {index + 1}: {mergedErrors[index]}</p> : null}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          disabled={disabled}
          variant="outline"
          onClick={() => setLinks((current) => [...current, ""])}
        >
          Add link
        </Button>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
    </div>
  );
}
