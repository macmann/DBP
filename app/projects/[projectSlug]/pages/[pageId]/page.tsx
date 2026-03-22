import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageStatusBadge } from "@/components/dashboard/PageStatusBadge";
import { PageEditorForm } from "@/components/forms/PageEditorForm";
import { VersionHistoryPanel } from "@/components/forms/VersionHistoryPanel";
import { PublicUrlActions } from "@/components/dashboard/PublicUrlActions";
import { detectStylePresetFromPrompt, stripStyleInstructionFromPrompt } from "@/lib/ai/stylePresets";
import { prisma } from "@/lib/db";
import { inspectGeneratedSchema, normalizeSchemaForDisplay } from "@/lib/ai/schemaInspection";
import { buildCanonicalPublicPath } from "@/lib/config/publishing";

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}



function deriveRequiredAssetSlots(schemaPayload: unknown): { requiresLogo: boolean; requiredImageSlots: number } {
  const normalized = normalizeSchemaForDisplay(schemaPayload);
  if (!normalized) {
    return { requiresLogo: false, requiredImageSlots: 0 };
  }

  const blocks = normalized.blocks ?? normalized.sections;
  const requiresLogo = blocks.some((block) => block.type === "logoStrip");
  const requiredImageSlots = blocks.reduce((count, block) => {
    if (block.type === "hero" || block.type === "imageText") {
      return count + 1;
    }

    const mediaAssetIds = Array.isArray(block.props?.mediaAssetIds)
      ? block.props.mediaAssetIds.filter((value): value is string => typeof value === "string")
      : Array.isArray(block.mediaAssetIds)
        ? block.mediaAssetIds.filter((value): value is string => typeof value === "string")
        : [];

    if (block.type === "gallery") {
      return count + Math.max(1, mediaAssetIds.length);
    }

    return count;
  }, 0);

  return { requiresLogo, requiredImageSlots };
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
    select: {
      id: true,
      title: true,
      slug: true,
      projectId: true,
      status: true,
      currentVersionId: true,
      publicSlug: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      prompt: true,
      referenceLinks: true,
      widgetEmbedHtml: true,
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
          generatedSchemaJson: true,
        },
      },
      versions: {
        orderBy: {
          versionNumber: "desc",
        },
        select: {
          id: true,
          versionNumber: true,
          createdAt: true,
          instructionPrompt: true,
          notes: true,
          generatedSchemaJson: true,
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

  const requiredAssetSlots = deriveRequiredAssetSlots(page.currentVersion?.generatedSchemaJson);
  const currentVersionInspection = page.currentVersion
    ? inspectGeneratedSchema(page.currentVersion.generatedSchemaJson)
    : null;

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
        <div className="space-y-1 text-sm text-muted">
          <p>Editor slug: /{page.slug}</p>
          <p>Canonical public path: {buildCanonicalPublicPath(page.publicSlug)}</p>
        </div>

        <PublicUrlActions path={buildCanonicalPublicPath(page.publicSlug)} />

        <div className="grid gap-4 rounded-xl border border-border bg-surface-elevated p-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <p className="mt-1">
              <PageStatusBadge status={page.status} />
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Page ID</p>
            <p className="mt-1 text-sm text-fg">{page.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Current version</p>
            <p className="mt-1 text-sm text-fg">
              {page.currentVersion ? `v${page.currentVersion.versionNumber}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Current version ID</p>
            <p className="mt-1 text-sm text-fg">{page.currentVersionId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Created</p>
            <p className="mt-1 text-sm text-fg">{formatDate(page.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Updated</p>
            <p className="mt-1 text-sm text-fg">{formatDate(page.updatedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Published</p>
            <p className="mt-1 text-sm text-fg">{formatDate(page.publishedAt)}</p>
          </div>
        </div>

        <PageEditorForm
          projectId={page.projectId}
          projectSlug={page.project.slug}
          pageId={page.id}
          previewSlug={page.publicSlug}
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
          isGenerationReady={Boolean(page.currentVersionId)}
          requiresLogo={requiredAssetSlots.requiresLogo}
          requiredImageSlots={requiredAssetSlots.requiredImageSlots}
          currentVersionInspection={currentVersionInspection}
          initialModel={{
            details: {
              title: page.title,
              slug: page.slug,
            },
            prompt: stripStyleInstructionFromPrompt(
              page.currentVersion?.instructionPrompt ?? page.prompt ?? "",
            ),
            stylePreset: detectStylePresetFromPrompt(
              page.currentVersion?.instructionPrompt ?? page.prompt ?? "",
            ),
            widgetEmbedHtml: page.widgetEmbedHtml ?? "",
            referenceLinks: Array.isArray(page.referenceLinks)
              ? page.referenceLinks.filter((link): link is string => typeof link === "string")
              : [],
          }}
        />

        {page.currentVersion?.notes ? (
          <section className="space-y-2 rounded-xl border border-border bg-surface-elevated p-6">
            <h2 className="text-lg font-semibold">Version notes</h2>
            <p className="text-sm text-muted">{page.currentVersion.notes}</p>
          </section>
        ) : null}

        <VersionHistoryPanel
          projectSlug={page.project.slug}
          pageId={page.id}
          currentVersionId={page.currentVersionId}
          versions={page.versions.map((version) => {
            const inspection = inspectGeneratedSchema(version.generatedSchemaJson);

            return {
              id: version.id,
              versionNumber: version.versionNumber,
              createdAt: version.createdAt.toISOString(),
              instructionPrompt: version.instructionPrompt,
              notes: version.notes,
              schemaValidity: inspection.isValid ? ("valid" as const) : ("invalid" as const),
              unknownBlockTypes: inspection.unknownBlockTypes,
              blockCount: inspection.blockCount,
            };
          })}
        />
      </div>
    </DashboardLayout>
  );
}
