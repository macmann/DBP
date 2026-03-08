import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

function getStatusColor(status: string) {
  if (status === "published") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "generating") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "failed") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-neutral-100 text-neutral-700";
}

export default async function ProjectPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectSlug },
    include: {
      pages: {
        orderBy: { updatedAt: "desc" }
      }
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          {project.description ? <p className="text-neutral-700">{project.description}</p> : null}
        </div>
        <Link
          href={`/projects/${project.id}/pages/new`}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New page
        </Link>
      </div>

      {project.pages.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          No pages yet. Create your first page.
        </div>
      ) : (
        <ul className="space-y-3">
          {project.pages.map((page) => (
            <li key={page.id}>
              <Link
                href={`/projects/${project.id}/pages/${page.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">{page.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">/{page.slug}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(page.status)}`}>
                  {page.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
