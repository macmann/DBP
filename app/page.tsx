import Link from "next/link";
import { prisma } from "@/lib/db";
import { PRODUCT_NAME } from "@/lib/config/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  let projectCount = 0;
  let pageCount = 0;
  let publishedCount = 0;
  let projects: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    updatedAt: Date;
    _count: { pages: number };
  }> = [];

  try {
    [projectCount, pageCount, publishedCount, projects] = await Promise.all([
      prisma.project.count(),
      prisma.page.count(),
      prisma.page.count({ where: { status: "published" } }),
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: {
              pages: true,
            },
          },
        },
        take: 8,
      }),
    ]);
  } catch {
    // Fall back to empty dashboard when the database is unavailable.
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-gradient-to-b from-surface-elevated to-surface p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Workspace Home</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Welcome to {PRODUCT_NAME}</h1>
            <p className="text-sm text-muted md:text-base">
              Manage your projects, monitor page status, and launch new builds from a focused dashboard experience.
            </p>
          </div>

          <Link href="/projects/new">
            <Button className="w-full md:w-auto">Create New Project</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted">Projects</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{projectCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Total Pages</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{pageCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted">Published Pages</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{publishedCount}</p>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Projects Dashboard</h2>
          {projects.length > 0 ? (
            <Link href="/projects" className="text-sm font-medium text-muted hover:text-fg">
              View all pages →
            </Link>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <p className="text-base font-medium text-fg">No projects found</p>
            <p className="mt-2 text-sm text-muted">Get started by creating your first project workspace.</p>
            <Link href="/projects/new" className="mt-5 inline-flex">
              <Button>Create New Project</Button>
            </Link>
          </Card>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="block rounded-2xl border border-border bg-surface-elevated p-5 transition hover:bg-secondary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-fg">{project.name}</p>
                      <p className="mt-1 text-sm text-muted">/{project.slug}</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {project._count.pages} {project._count.pages === 1 ? "page" : "pages"}
                    </span>
                  </div>
                  {project.description ? <p className="mt-3 text-sm text-muted">{project.description}</p> : null}
                  <p className="mt-4 text-xs text-muted">Updated {project.updatedAt.toLocaleDateString()}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
