import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            pages: true,
          },
        },
      },
    });

    return (
      <DashboardLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]} action={{ label: "New project", href: "/projects/new" }}>
        <div className="space-y-6">
          <p className="text-sm text-neutral-600 md:text-base">Select a project to view and manage its pages.</p>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <p className="text-base font-medium text-neutral-900">No projects yet</p>
              <p className="mt-2 text-sm text-neutral-600">Create your first project to start generating and managing pages.</p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Create a project
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-medium text-neutral-900">{project.name}</p>
                      <p className="text-xs text-neutral-500">{project._count.pages} pages</p>
                    </div>
                    {project.description ? <p className="mt-1 text-sm text-neutral-600">{project.description}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardLayout>
    );
  } catch {
    return (
      <DashboardLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-medium">Could not load projects.</p>
          <p className="mt-1">Refresh the page or create a new project to continue.</p>
          <Link href="/projects/new" className="mt-4 inline-block text-red-800 underline">
            Create a project
          </Link>
        </div>
      </DashboardLayout>
    );
  }
}
