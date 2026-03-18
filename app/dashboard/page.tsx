import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
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
          <p className="text-sm text-muted md:text-base">Select a project to view and manage its pages.</p>

          {projects.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-base font-medium text-fg">No projects yet</p>
              <p className="mt-2 text-sm text-muted">Create your first project to start generating and managing pages.</p>
              <Link href="/projects/new" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Create a project
              </Link>
            </Card>
          ) : (
            <ul className="space-y-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="block rounded-2xl border border-border bg-surface-elevated p-4 transition hover:bg-secondary"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-medium text-fg">{project.name}</p>
                      <p className="text-xs text-muted">{project._count.pages} pages</p>
                    </div>
                    {project.description ? <p className="mt-1 text-sm text-muted">{project.description}</p> : null}
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
        <Alert variant="danger" className="rounded-2xl p-6">
          <p className="font-medium">Could not load projects.</p>
          <p className="mt-1">Refresh the page or create a new project to continue.</p>
          <Link href="/projects/new" className="mt-4 inline-block underline">
            Create a project
          </Link>
        </Alert>
      </DashboardLayout>
    );
  }
}
