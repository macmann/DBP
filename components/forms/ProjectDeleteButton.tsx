"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject } from "@/app/actions";
import { Button } from "@/components/ui/button";

type ProjectDeleteButtonProps = {
  projectSlug: string;
};

export function ProjectDeleteButton({ projectSlug }: ProjectDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={isPending}
        onClick={() => {
          const confirmed = window.confirm(
            "Delete this project permanently? This removes all pages and versions and cannot be undone.",
          );

          if (!confirmed) {
            return;
          }

          setErrorMessage(null);
          startTransition(async () => {
            const result = await deleteProject(projectSlug);

            if (result.status === "error") {
              setErrorMessage(result.message);
              return;
            }

            router.push("/dashboard");
            router.refresh();
          });
        }}
      >
        {isPending ? "Deleting project..." : "Delete project"}
      </Button>
      {errorMessage ? <p className="text-xs text-danger">{errorMessage}</p> : null}
    </div>
  );
}
