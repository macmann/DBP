"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type CreatePageState } from "@/app/actions";
import { ReferenceLinksListEditor } from "@/components/forms/ReferenceLinksListEditor";

type PageCreateFormProps = {
  projectSlug: string;
  action: (state: CreatePageState, formData: FormData) => Promise<CreatePageState>;
};

export function PageCreateForm({ projectSlug, action }: PageCreateFormProps) {
  const [state, formAction, isPending] = useActionState(action, { ok: true } satisfies CreatePageState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-neutral-200 p-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
          Page title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Pricing"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
        {state.fieldErrors?.title ? <p className="text-sm text-red-700">{state.fieldErrors.title}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium text-neutral-900">
          URL slug (optional)
        </label>
        <input
          id="slug"
          name="slug"
          placeholder="pricing"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
        {state.fieldErrors?.slug ? <p className="text-sm text-red-700">{state.fieldErrors.slug}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium text-neutral-900">
          Prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={5}
          placeholder="Describe the page you want to generate..."
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
        {state.fieldErrors?.prompt ? <p className="text-sm text-red-700">{state.fieldErrors.prompt}</p> : null}
      </div>

      <ReferenceLinksListEditor
        initialLinks={[""]}
        error={state.fieldErrors?.referenceLinks}
        rowErrors={state.fieldErrors?.referenceLinkRows}
      />

      {state.formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.formError}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create page"}
        </button>
        <Link href={`/projects/${projectSlug}`} className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
