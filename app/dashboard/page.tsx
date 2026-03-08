import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          pages: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-neutral-700">Select a project to view and manage its pages.</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          No projects yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <p className="font-medium text-neutral-900">{project.name}</p>
                {project.description ? <p className="mt-1 text-sm text-neutral-600">{project.description}</p> : null}
                <p className="mt-3 text-xs text-neutral-500">{project._count.pages} pages</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
