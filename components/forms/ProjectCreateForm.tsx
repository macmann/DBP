import Link from "next/link";
import { createProject } from "@/app/actions";

export function ProjectCreateForm() {
  return (
    <form action={createProject} className="space-y-4 rounded-xl border border-neutral-200 p-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-neutral-900">
          Project name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Documentation Site"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
        />
      </div>

      <p className="text-xs text-neutral-500">The project slug is generated automatically from the name.</p>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          Create project
        </button>
        <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900">
          Cancel
        </Link>
      </div>
    </form>
  );
}
