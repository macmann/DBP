"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { type CreatePageState } from "@/app/actions";
import { STYLE_PRESETS, type StylePresetKey } from "@/lib/ai/stylePresets";
import { FormTextArea } from "@/components/forms/FormTextArea";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { ReferenceLinksListEditor } from "@/components/forms/ReferenceLinksListEditor";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type PageCreateFormProps = {
  projectSlug: string;
  action: (state: CreatePageState, formData: FormData) => Promise<CreatePageState>;
};

export function PageCreateForm({ projectSlug, action }: PageCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, { ok: true } satisfies CreatePageState);
  const formRef = useRef<HTMLFormElement>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [stylePreset, setStylePreset] = useState<StylePresetKey>(STYLE_PRESETS[0].key);

  function openStyleModal() {
    if (!formRef.current?.reportValidity()) {
      return;
    }
    setIsStyleModalOpen(true);
  }

  function confirmCreateAndGenerate() {
    setIsStyleModalOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm md:p-6"
        aria-busy={isPending}
      >
        <input type="hidden" name="stylePreset" value={stylePreset} />
        <FormTextInput
          id="title"
          name="title"
          label="Page title"
          required
          placeholder="Pricing"
          error={state.fieldErrors?.title}
          disabled={isPending}
        />

        <FormTextInput
          id="slug"
          name="slug"
          label="URL slug"
          placeholder="pricing"
          helperText="Optional. If left blank, the slug is generated from the title."
          error={state.fieldErrors?.slug}
          disabled={isPending}
        />

        <FormTextArea
          id="prompt"
          name="prompt"
          label="Prompt"
          required
          rows={5}
          placeholder="Describe the page you want to generate..."
          helperText="Include goals, audience, style, and key sections to improve first-pass quality."
          error={state.fieldErrors?.prompt}
          disabled={isPending}
        />

        <FormTextArea
          id="widgetEmbedHtml"
          name="widgetEmbedHtml"
          label="Widget embed HTML (optional)"
          rows={4}
          placeholder='<script src="https://demo.atenxion.ai/api/atenxion-widget-script?agentchainId=..."></script>'
          helperText="Paste widget script/embed HTML. It will be saved and injected on the public page."
          error={state.fieldErrors?.widgetEmbedHtml}
          disabled={isPending}
        />

        <ReferenceLinksListEditor
          initialLinks={[""]}
          error={state.fieldErrors?.referenceLinks}
          rowErrors={state.fieldErrors?.referenceLinkRows}
          disabled={isPending}
        />

        {state.fieldErrors?.stylePreset ? <Alert variant="danger">{state.fieldErrors.stylePreset}</Alert> : null}
        {state.formError ? <Alert variant="danger">{state.formError}</Alert> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" onClick={openStyleModal} disabled={isPending}>
            {isPending ? "Creating page..." : "Create page"}
          </Button>
          <Link href={`/projects/${projectSlug}`} className="text-sm text-muted hover:text-fg">
            Cancel
          </Link>
        </div>
      </form>

      {isStyleModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-fg">Choose a generation style</h3>
            <p className="mt-1 text-sm text-muted">Pick one of six templates before generation.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {STYLE_PRESETS.map((preset) => (
                <label
                  key={preset.key}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    stylePreset === preset.key ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="style-preview"
                    value={preset.key}
                    checked={stylePreset === preset.key}
                    onChange={() => setStylePreset(preset.key)}
                  />
                  <p className="text-sm font-semibold text-fg">{preset.label}</p>
                  <p className="mt-1 text-xs text-muted">{preset.description}</p>
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsStyleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmCreateAndGenerate}>
                Confirm & generate
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
