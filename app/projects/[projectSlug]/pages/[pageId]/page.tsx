import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageStatusBadge } from "@/components/dashboard/PageStatusBadge";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export default async function PageDetailPage({
  params
}: {
  params: Promise<{ projectSlug: string; pageId: string }>;
}) {
  const { projectSlug, pageId } = await params;

  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      project: {
        slug: projectSlug
      }
    },
    include: {
      project: {
        select: {
          slug: true,
          name: true
        }
      }
    }
  });

  if (!page) {
    notFound();
  }

  const promptText = page.prompt ?? "No prompt has been saved for this page yet.";
  const referenceLinks = Array.isArray(page.referenceLinks) ? page.referenceLinks.filter((link): link is string => typeof link === "string") : [];

  return (
    <DashboardLayout
      title={page.title}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: page.project.slug, href: `/projects/${page.project.slug}` },
        { label: page.title }
      ]}
      action={{ label: "New Page", href: `/projects/${page.project.slug}/pages/new` }}
    >
      <div className="space-y-6">
        <p className="text-sm text-neutral-600">/{page.slug}</p>

        <div className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Status</p>
            <p className="mt-1">
              <PageStatusBadge status={page.status} />
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Page ID</p>
            <p className="mt-1 text-sm text-neutral-800">{page.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Created</p>
            <p className="mt-1 text-sm text-neutral-800">{formatDate(page.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Updated</p>
            <p className="mt-1 text-sm text-neutral-800">{formatDate(page.updatedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Published</p>
            <p className="mt-1 text-sm text-neutral-800">{formatDate(page.publishedAt)}</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Prompt</h2>
          <p className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">{promptText}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Reference links</h2>
          {referenceLinks.length === 0 ? (
            <p className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">No reference links attached yet.</p>
          ) : (
            <ul className="space-y-2">
              {referenceLinks.map((link) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-neutral-200 bg-white p-4 text-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    <p className="text-neutral-700">{link}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
