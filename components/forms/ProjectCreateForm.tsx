"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProject, type CreateProjectState } from "@/app/actions";
import { FormTextInput } from "@/components/forms/FormTextInput";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ProjectCreateForm() {
  const [state, formAction, isPending] = useActionState(createProject, { ok: true } satisfies CreateProjectState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm md:p-6" aria-busy={isPending}>
      <FormTextInput
        id="name"
        name="name"
        label="Project name"
        required
        placeholder="Documentation Site"
        error={state.fieldErrors?.name}
        helperText="The project slug is generated automatically from the name."
        disabled={isPending}
      />

      {state.formError ? <Alert variant="danger">{state.formError}</Alert> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Creating project..." : "Create project"}
        </Button>
        <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
          Cancel
        </Link>
      </div>
    </form>
  );
}
