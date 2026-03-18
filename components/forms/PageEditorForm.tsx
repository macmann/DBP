"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  buildPage,
  generateNewVersion,
  updatePage,
  type UpdatePageState,
} from "@/app/actions";
import { FormSection } from "@/components/forms/FormSection";
import { FormTextArea } from "@/components/forms/FormTextArea";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { ReferenceLinksListEditor } from "@/components/forms/ReferenceLinksListEditor";
import { cn } from "@/lib/utils/cn";
import type { PageEditorFormModel } from "@/types/page-editor";

type PageEditorFormProps = {
  projectSlug: string;
  pageId: string;
  previewSlug: string;
  initialModel: PageEditorFormModel;
};

type SurfaceStatus = "idle" | "success" | "error" | "running";

const statusStyles: Record<SurfaceStatus, string> = {
  idle: "border-neutral-200 bg-neutral-50 text-neutral-700",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusIcons: Record<SurfaceStatus, string> = {
  idle: "○",
  running: "◔",
  error: "⚠",
  success: "✓",
};

function StatusSurface({ status, message }: { status: SurfaceStatus; message: string }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", statusStyles[status])}>
      <span aria-hidden className="mt-0.5 font-semibold">
        {statusIcons[status]}
      </span>
      <span>{message}</span>
    </p>
  );
}

export function PageEditorForm({ projectSlug, pageId, previewSlug, initialModel }: PageEditorFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updatePage.bind(null, projectSlug, pageId),
    { status: "idle", ok: true, message: "" } satisfies UpdatePageState,
  );
  const [isBuildPending, startBuildTransition] = useTransition();
  const [isVersionPending, startVersionTransition] = useTransition();
  const [iterativeInstruction, setIterativeInstruction] = useState("");
  const [buildState, setBuildState] = useState<{ status: SurfaceStatus; message: string }>({
    status: "idle",
    message: "Click Build page to generate a new version from the current prompt and assets.",
  });
  const [versionState, setVersionState] = useState<{ status: SurfaceStatus; message: string }>({
    status: "idle",
    message: "Latest preview reflects the newest version after generation or rollback.",
  });
  const [previewState, setPreviewState] = useState<{ status: SurfaceStatus; message: string }>({
    status: "idle",
    message: "Open preview to verify the latest published page in a new tab.",
  });

  useEffect(() => {
    const handlePreviewUpdate = () => {
      setPreviewState({
        status: "success",
        message: "Rollback succeeded. Open preview to verify the latest published version.",
      });
    };

    window.addEventListener("page-preview-updated", handlePreviewUpdate);
    return () => window.removeEventListener("page-preview-updated", handlePreviewUpdate);
  }, []);

  return (
    <form action={formAction} className="space-y-5" aria-busy={isPending || isBuildPending || isVersionPending}>
      <FormSection title="Page details" description="Update the name and URL slug for this page.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormTextInput
            id="title"
            name="title"
            label="Page title"
            defaultValue={initialModel.details.title}
            required
            error={state.fieldErrors?.title}
            disabled={isPending}
          />
          <FormTextInput
            id="slug"
            name="slug"
            label="URL slug"
            defaultValue={initialModel.details.slug}
            helperText="Used in the page URL. Lowercase letters, numbers, and hyphens are best."
            error={state.fieldErrors?.slug}
            disabled={isPending}
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
          helperText="Include audience, value proposition, and conversion intent for better output quality."
          error={state.fieldErrors?.prompt}
          disabled={isPending}
        />
      </FormSection>

      <FormSection title="Reference links">
        <ReferenceLinksListEditor
          initialLinks={initialModel.referenceLinks}
          error={state.fieldErrors?.referenceLinks}
          rowErrors={state.fieldErrors?.referenceLinkRows}
          disabled={isPending}
        />
      </FormSection>

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
        <h3 className="text-base font-semibold text-neutral-900">Preview</h3>
        <StatusSurface status={previewState.status} message={previewState.message} />
        <a
          href={`/demo/${previewSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:w-auto"
        >
          Preview latest published
        </a>
      </section>

      {state.status === "error" ? <StatusSurface status="error" message={state.message} /> : null}
      {state.status === "success" ? <StatusSurface status="success" message={state.message} /> : null}

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
        <h3 className="text-base font-semibold text-neutral-900">Build action</h3>
        <StatusSurface status={buildState.status} message={buildState.message} />

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving changes..." : "Save changes"}
          </button>
          <button
            type="button"
            disabled={isBuildPending}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              startBuildTransition(async () => {
                setBuildState({ status: "running", message: "Building page now. This can take a moment..." });
                const result = await buildPage(projectSlug, pageId);

                if (result.status === "success") {
                  setBuildState({
                    status: "success",
                    message: `Build succeeded. Saved v${result.versionNumber} with ${result.sectionCount} sections.`,
                  });
                  router.refresh();
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

      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
        <h3 className="text-base font-semibold text-neutral-900">Iterative update</h3>
        <StatusSurface status={versionState.status} message={versionState.message} />
        <FormTextArea
          id="iterativeInstruction"
          name="iterativeInstruction"
          label="Update instructions"
          rows={5}
          value={iterativeInstruction}
          onChange={(event) => setIterativeInstruction(event.target.value)}
          placeholder="Example: Keep the hero, replace testimonial section with pricing cards, and tighten SEO description."
          helperText="Describe only what should change from the current version."
          disabled={isVersionPending}
        />
        <div>
          <button
            type="button"
            disabled={isVersionPending}
            className="w-full rounded-xl border border-blue-300 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            onClick={() => {
              startVersionTransition(async () => {
                setVersionState({ status: "running", message: "Generating a new version from your instructions..." });
                const result = await generateNewVersion(projectSlug, pageId, iterativeInstruction);

                if (result.status === "success") {
                  setIterativeInstruction("");
                  setVersionState({
                    status: "success",
                    message: `Generated v${result.versionNumber} (${result.sectionCount} sections). The latest preview now points to this version.`,
                  });
                  setPreviewState({
                    status: "success",
                    message: "Generation succeeded. Open preview to review the latest published version.",
                  });
                  router.refresh();
                } else {
                  setVersionState({
                    status: "error",
                    message: result.message,
                  });
                }
              });
            }}
          >
            {isVersionPending ? "Generating version..." : "Generate new version"}
          </button>
        </div>
      </section>
    </form>
  );
}
