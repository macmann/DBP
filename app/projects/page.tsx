import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
          <p className="text-sm text-neutral-600 md:text-base">Browse all pages across projects and jump into the editor quickly.</p>

          {pages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <p className="text-base font-medium text-neutral-900">No pages yet</p>
              <p className="mt-2 text-sm text-neutral-600">Create a project first, then add your first page from that project.</p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Create a project
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {pages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/projects/${page.project.slug}/pages/${page.id}`}
                    className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-medium text-neutral-900">{page.title}</p>
                      <p className="text-xs text-neutral-500">/{page.slug}</p>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">Project: {page.project.name}</p>
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-medium">Could not load pages.</p>
          <p className="mt-1">Try refreshing. If this persists, create a new project and re-open this view.</p>
          <Link href="/projects/new" className="mt-4 inline-block text-red-800 underline">
            Create a project
          </Link>
        </div>
      </DashboardLayout>
    );
  }
}
