import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export default async function ProjectsPage() {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        project: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
      take: 50,
    });

    return (
      <DashboardLayout
        title="All pages"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pages" }]}
        action={{ label: "New project", href: "/projects/new" }}
      >
        <div className="space-y-6">
          <p className="text-sm text-muted md:text-base">Browse all pages across projects and jump into the editor quickly.</p>

          {pages.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-base font-medium text-fg">No pages yet</p>
              <p className="mt-2 text-sm text-muted">Create a project first, then add your first page from that project.</p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Create a project
              </Link>
            </Card>
          ) : (
            <ul className="space-y-3">
              {pages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/projects/${page.project.slug}/pages/${page.id}`}
                    className="block rounded-2xl border border-border bg-surface-elevated p-4 transition hover:bg-secondary"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-medium text-fg">{page.title}</p>
                      <p className="text-xs text-muted">/{page.slug}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">Project: {page.project.name}</p>
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
      <DashboardLayout title="All pages" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pages" }]}>
        <Alert variant="danger" className="rounded-2xl p-6">
          <p className="font-medium">Could not load pages.</p>
          <p className="mt-1">Try refreshing. If this persists, create a new project and re-open this view.</p>
          <Link href="/projects/new" className="mt-4 inline-block underline">
            Create a project
          </Link>
        </Alert>
      </DashboardLayout>
    );
  }
}
