"use client";

import { useActionState } from "react";
import { initialUpdatePageState, updatePage } from "@/app/actions";
import { FormSection } from "@/components/forms/FormSection";
import { FormTextArea } from "@/components/forms/FormTextArea";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { ReferenceLinksListEditor } from "@/components/forms/ReferenceLinksListEditor";
import type { PageEditorFormModel } from "@/types/page-editor";

type PageEditorFormProps = {
  projectSlug: string;
  pageId: string;
  initialModel: PageEditorFormModel;
};

export function PageEditorForm({ projectSlug, pageId, initialModel }: PageEditorFormProps) {
  const [state, formAction, isPending] = useActionState(
    updatePage.bind(null, projectSlug, pageId),
    initialUpdatePageState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormSection title="Page details" description="Update the name and URL slug for this page.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextInput
            id="title"
            name="title"
            label="Page title"
            defaultValue={initialModel.details.title}
            required
            error={state.fieldErrors?.title}
          />
          <FormTextInput
            id="slug"
            name="slug"
            label="URL slug"
            defaultValue={initialModel.details.slug}
            error={state.fieldErrors?.slug}
          />
        </div>
      </FormSection>

      <FormSection title="Prompt" description="Provide generation instructions for this page.">
        <FormTextArea
          id="prompt"
          name="prompt"
          label="Prompt"
          rows={7}
          defaultValue={initialModel.prompt}
          placeholder="Describe the layout, content, and style for this page..."
        />
      </FormSection>

      <FormSection title="Reference links">
        <ReferenceLinksListEditor
          initialLinks={initialModel.referenceLinks}
          error={state.fieldErrors?.referenceLinks}
        />
      </FormSection>

      {state.status === "error" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          onClick={() => {
            // Placeholder for build trigger action.
          }}
        >
          Build page
        </button>
      </div>
    </form>
  );
}
