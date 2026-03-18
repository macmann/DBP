"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { quickGeneratePage, type QuickGenerateState } from "@/app/actions";

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
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">Generate a page</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Start with the essentials. Advanced controls stay in the dashboard editor.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-neutral-700" htmlFor="projectName">
            Project name
            <input
              id="projectName"
              name="projectName"
              required
              placeholder="Acme"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-300 transition focus:border-neutral-500 focus:ring"
            />
            {state.fieldErrors?.projectName ? (
              <p className="text-xs text-red-600">{state.fieldErrors.projectName}</p>
            ) : null}
          </label>

          <label className="space-y-1 text-sm font-medium text-neutral-700" htmlFor="pageName">
            Page name
            <input
              id="pageName"
              name="pageName"
              required
              placeholder="Spring Campaign Landing Page"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-300 transition focus:border-neutral-500 focus:ring"
            />
            {state.fieldErrors?.pageName ? (
              <p className="text-xs text-red-600">{state.fieldErrors.pageName}</p>
            ) : null}
          </label>
        </div>

        <label className="space-y-1 text-sm font-medium text-neutral-700" htmlFor="prompt">
          Prompt
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={6}
            placeholder="Create a conversion-focused page for a B2B analytics product with social proof, clear CTAs, and concise value props."
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-300 transition focus:border-neutral-500 focus:ring"
          />
          {state.fieldErrors?.prompt ? (
            <p className="text-xs text-red-600">{state.fieldErrors.prompt}</p>
          ) : null}
        </label>

        {state.status === "error" && state.message ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {isPending ? "Generating..." : "Generate page"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Edit in dashboard
          </Link>
        </div>
      </form>
    </section>
  );
}
