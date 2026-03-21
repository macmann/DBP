"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quickGeneratePage, type QuickGenerateState } from "@/app/actions";
import { STYLE_PRESETS, type StylePresetKey } from "@/lib/ai/stylePresets";
import { FormTextArea } from "@/components/forms/FormTextArea";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const initialState: QuickGenerateState = {
  status: "idle",
};

export function PrimaryGenerateForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(quickGeneratePage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [stylePreset, setStylePreset] = useState<StylePresetKey>(STYLE_PRESETS[0].key);

  useEffect(() => {
    if (state.status === "success" && state.publicSlug) {
      setIsSuccessModalOpen(true);
      const timeout = window.setTimeout(() => {
        router.push(`/demo/${state.publicSlug}`);
      }, 900);
      return () => window.clearTimeout(timeout);
    }
  }, [router, state.publicSlug, state.status]);

  function openStyleModal() {
    if (!formRef.current?.reportValidity()) {
      return;
    }
    setIsStyleModalOpen(true);
  }

  function confirmGenerate() {
    setIsStyleModalOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-fg">Generate a page</h2>
      <p className="mt-1 text-sm text-muted">
        Start with the essentials. Advanced controls stay in the dashboard editor.
      </p>

      <form ref={formRef} action={formAction} className="mt-5 space-y-4" aria-busy={isPending}>
        <input type="hidden" name="stylePreset" value={stylePreset} />
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextInput
            id="projectName"
            name="projectName"
            label="Project name"
            required
            placeholder="Acme"
            error={state.fieldErrors?.projectName}
            disabled={isPending}
          />

          <FormTextInput
            id="pageName"
            name="pageName"
            label="Page name"
            required
            placeholder="Spring Campaign Landing Page"
            error={state.fieldErrors?.pageName}
            disabled={isPending}
          />
        </div>

        <FormTextArea
          id="prompt"
          name="prompt"
          label="Prompt"
          required
          rows={6}
          placeholder="Create a conversion-focused page for a B2B analytics product with social proof, clear CTAs, and concise value props."
          helperText="Tip: include a target audience and conversion goal for stronger copy and structure."
          error={state.fieldErrors?.prompt}
          disabled={isPending}
        />

        {state.status === "error" && state.message ? (
          <Alert variant="danger">{state.message}</Alert>
        ) : null}
        {state.fieldErrors?.stylePreset ? <Alert variant="danger">{state.fieldErrors.stylePreset}</Alert> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="button" onClick={openStyleModal} disabled={isPending}>
            {isPending ? "Generating page..." : "Generate page"}
          </Button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border px-4 py-2 text-center text-sm font-medium text-fg hover:bg-secondary"
          >
            Edit in dashboard
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
              <Button type="button" onClick={confirmGenerate}>
                Confirm & generate
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-xl">
            <p className="text-base font-semibold text-fg">Generating your page…</p>
            <p className="mt-1 text-sm text-muted">Applying selected style and building layout.</p>
          </div>
        </div>
      ) : null}

      {isSuccessModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-success/30 bg-surface p-6 text-center shadow-xl">
            <p className="text-base font-semibold text-success">Generation completed!</p>
            <p className="mt-1 text-sm text-muted">Your styled page is ready. Redirecting to preview…</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
