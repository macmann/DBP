import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageStatusBadge } from "@/components/dashboard/PageStatusBadge";
import { PublicUrlActions } from "@/components/dashboard/PublicUrlActions";
import { ProjectDeleteButton } from "@/components/forms/ProjectDeleteButton";
import { buildCanonicalPublicPath } from "@/lib/config/publishing";
import { prisma } from "@/lib/db";

export default async function ProjectPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      pages: {
        orderBy: { updatedAt: "desc" },
        include: {
          currentVersion: {
            select: {
              versionNumber: true
            }
          }
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  return (
    <DashboardLayout
      title={project.name}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: project.slug },
        { label: "Pages" }
      ]}
      action={{ label: "New Page", href: `/projects/${project.slug}/pages/new` }}
    >
      <div className="space-y-6">
        {project.description ? <p className="text-neutral-700">{project.description}</p> : null}

        <section className="space-y-3 rounded-2xl border border-danger/40 bg-danger/5 p-5 shadow-sm md:p-6">
          <h2 className="text-base font-semibold text-fg">Danger zone</h2>
          <p className="text-sm text-muted">Delete this project permanently, including all pages and versions.</p>
          <ProjectDeleteButton projectSlug={project.slug} />
        </section>

        {project.pages.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            No pages yet. Create your first page.
          </div>
        ) : (
          <ul className="space-y-3">
            {project.pages.map((page) => (
              <li key={page.id}>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300">
                  <div className="flex items-center justify-between gap-4">
                    <Link href={`/projects/${project.slug}/pages/${page.id}`} className="min-w-0">
                      <p className="font-medium text-neutral-900">{page.title}</p>
                      <p className="mt-1 text-sm text-neutral-600">/{page.slug}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {page.currentVersion ? `v${page.currentVersion.versionNumber}` : "No current version"}
                      </p>
                    </Link>
                    <PageStatusBadge status={page.status} />
                  </div>
                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <PublicUrlActions
                      compact
                      label="Public URL"
                      path={buildCanonicalPublicPath(page.publicSlug)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
