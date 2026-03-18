"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quickGeneratePage, type QuickGenerateState } from "@/app/actions";
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

  useEffect(() => {
    if (state.status === "success" && state.publicSlug) {
      router.push(`/demo/${state.publicSlug}`);
    }
  }, [router, state.publicSlug, state.status]);

  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-fg">Generate a page</h2>
      <p className="mt-1 text-sm text-muted">
        Start with the essentials. Advanced controls stay in the dashboard editor.
      </p>

      <form action={formAction} className="mt-5 space-y-4" aria-busy={isPending}>
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

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button type="submit" disabled={isPending}>
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
    </section>
  );
}
