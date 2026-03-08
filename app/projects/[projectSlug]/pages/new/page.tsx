import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function NewProjectPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectSlug },
    select: {
      id: true,
      name: true
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href={`/projects/${project.id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Back to {project.name}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Create a page</h1>
        <p className="text-neutral-700">Add a new page to the {project.name} project.</p>
      </div>

      <form className="space-y-4 rounded-xl border border-neutral-200 p-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-neutral-900">
            Page title
          </label>
          <input
            id="title"
            name="title"
            placeholder="Pricing"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium text-neutral-900">
            URL slug
          </label>
          <input
            id="slug"
            name="slug"
            placeholder="pricing"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-neutral-900/10 placeholder:text-neutral-400 focus:ring"
          />
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
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Create page
          </button>
          <Link href={`/projects/${project.id}`} className="text-sm text-neutral-600 hover:text-neutral-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
