"use client";

import { useActionState, useState, useTransition } from "react";
import { buildPage, updatePage, type UpdatePageState } from "@/app/actions";
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
    { status: "idle", ok: true, message: "" } satisfies UpdatePageState,
  );
  const [isBuildPending, startBuildTransition] = useTransition();
  const [buildState, setBuildState] = useState<{
    status: "idle" | "success" | "error" | "running";
    message: string;
  }>({
    status: "idle",
    message: "Click Build page to generate a new version from the current prompt and assets.",
  });

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
          error={state.fieldErrors?.prompt}
        />
      </FormSection>

      <FormSection title="Reference links">
        <ReferenceLinksListEditor
          initialLinks={initialModel.referenceLinks}
          error={state.fieldErrors?.referenceLinks}
          rowErrors={state.fieldErrors?.referenceLinkRows}
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

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-base font-semibold text-neutral-900">Build action</h3>
        {buildState.status === "idle" ? (
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            {buildState.message}
          </p>
        ) : null}
        {buildState.status === "running" ? (
          <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {buildState.message}
          </p>
        ) : null}
        {buildState.status === "error" ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {buildState.message}
          </p>
        ) : null}
        {buildState.status === "success" ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {buildState.message}
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
            disabled={isBuildPending}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            onClick={() => {
              startBuildTransition(async () => {
                setBuildState({ status: "running", message: "Building page now. This can take a moment..." });
                const result = await buildPage(projectSlug, pageId);

                if (result.status === "success") {
                  setBuildState({
                    status: "success",
                    message: `Build succeeded. Saved v${result.versionNumber} with ${result.sectionCount} sections.`,
                  });
                } else {
                  setBuildState({
                    status: "error",
                    message: result.message,
                  });
                }
              });
            }}
          >
            {isBuildPending ? "Building..." : "Build page"}
          </button>
        </div>
      </section>
    </form>
  );
}
