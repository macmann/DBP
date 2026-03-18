"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type CreatePageState } from "@/app/actions";
import { FormTextArea } from "@/components/forms/FormTextArea";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { ReferenceLinksListEditor } from "@/components/forms/ReferenceLinksListEditor";

type PageCreateFormProps = {
  projectSlug: string;
  action: (state: CreatePageState, formData: FormData) => Promise<CreatePageState>;
};

export function PageCreateForm({ projectSlug, action }: PageCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, { ok: true } satisfies CreatePageState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6" aria-busy={isPending}>
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

      <ReferenceLinksListEditor
        initialLinks={[""]}
        error={state.fieldErrors?.referenceLinks}
        rowErrors={state.fieldErrors?.referenceLinkRows}
        disabled={isPending}
      />

      {state.formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.formError}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating page..." : "Create page"}
        </button>
        <Link href={`/projects/${projectSlug}`} className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
