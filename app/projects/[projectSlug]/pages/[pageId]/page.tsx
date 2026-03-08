import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageStatusBadge } from "@/components/dashboard/PageStatusBadge";
import { PageAssetsSection } from "@/components/assets/PageAssetsSection";
import { PageEditorForm } from "@/components/forms/PageEditorForm";
import { prisma } from "@/lib/db";

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ projectSlug: string; pageId: string }>;
}) {
  const { projectSlug, pageId } = await params;

  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      project: {
        slug: projectSlug,
      },
    },
    include: {
      project: {
        select: {
          slug: true,
          name: true,
        },
      },
      currentVersion: {
        select: {
          id: true,
          versionNumber: true,
          instructionPrompt: true,
          notes: true,
        },
      },
      assets: {
        where: {
          pageId,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          projectId: true,
          pageId: true,
          type: true,
          sortOrder: true,
          fileName: true,
          mimeType: true,
          storageUrl: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!page) {
    notFound();
  }

  return (
    <DashboardLayout
      title={page.title}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: page.project.slug, href: `/projects/${page.project.slug}` },
        { label: page.title },
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
            <p className="text-xs uppercase tracking-wide text-neutral-500">Current version</p>
            <p className="mt-1 text-sm text-neutral-800">
              {page.currentVersion ? `v${page.currentVersion.versionNumber}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Current version ID</p>
            <p className="mt-1 text-sm text-neutral-800">{page.currentVersionId ?? "—"}</p>
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

        <PageEditorForm
          projectSlug={page.project.slug}
          pageId={page.id}
          initialModel={{
            details: {
              title: page.title,
              slug: page.slug,
            },
            prompt: page.currentVersion?.instructionPrompt ?? page.prompt ?? "",
            referenceLinks: Array.isArray(page.referenceLinks)
              ? page.referenceLinks.filter((link): link is string => typeof link === "string")
              : [],
          }}
        />

        {page.currentVersion?.notes ? (
          <section className="space-y-2 rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Version notes</h2>
            <p className="text-sm text-neutral-700">{page.currentVersion.notes}</p>
          </section>
        ) : null}

        <PageAssetsSection
          projectId={page.projectId}
          pageId={page.id}
          initialAssets={page.assets.map((asset) => ({
            id: asset.id,
            projectId: asset.projectId,
            pageId: asset.pageId,
            type: asset.type,
            sortOrder: asset.sortOrder,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            storageUrl: asset.storageUrl,
            metadata: (asset.metadata as Record<string, unknown> | null) ?? null,
            createdAt: asset.createdAt.toISOString(),
          }))}
        />
      </div>
    </DashboardLayout>
  );
}
