"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProject, type CreateProjectState } from "@/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProjectCreateForm() {
  const [state, formAction, isPending] = useActionState(createProject, { ok: true } satisfies CreateProjectState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border p-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-fg">
          Project name
        </label>
        <Input id="name" name="name" required placeholder="Documentation Site" />
        {state.fieldErrors?.name ? <p className="text-sm text-danger">{state.fieldErrors.name}</p> : null}
      </div>

      <p className="text-xs text-muted">The project slug is generated automatically from the name.</p>

      {state.formError ? <Alert variant="danger">{state.formError}</Alert> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create project"}
        </Button>
        <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
          Cancel
        </Link>
      </div>
    </form>
  );
}
