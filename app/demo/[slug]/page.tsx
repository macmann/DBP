import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { PageRenderer } from "@/components/landing/PageRenderer";
import { WidgetEmbed } from "@/components/landing/WidgetEmbed";
import type { AssetResolver, ResolvedAsset } from "@/components/landing/types";
import type { GeneratedBlock, GeneratedPageSchema, GeneratedPageLayout } from "@/lib/ai/schema";
import { validateGeneratedPageSchema } from "@/lib/ai/schema";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/lib/config/brand";
import { getPublishedDemoPage } from "@/lib/public-pages";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

type AssetLookupMap = Map<string, ResolvedAsset>;
type DemoLayoutEntry = string | GeneratedBlock;
type DemoLayoutRegion = "top" | "main" | "bottom";
type DemoPublishedPage = NonNullable<Awaited<ReturnType<typeof getPublishedDemoPage>>>;

type DemoLayoutContext = {
  page: DemoPublishedPage;
  schema: GeneratedPageSchema;
  logoAsset: DemoPublishedPage["assets"][number] | undefined;
  resolveAsset: AssetResolver;
  currentVersionLabel: string;
};

const SITE_DEFAULT_TITLE = PRODUCT_NAME;
const SITE_DEFAULT_DESCRIPTION = PRODUCT_DESCRIPTION;

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedDemoPage({ publicSlug: slug });

  const fallbackTitle = page?.title || SITE_DEFAULT_TITLE;
  const fallbackDescription = SITE_DEFAULT_DESCRIPTION;

  if (!page) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  const parsedSchema = validateGeneratedPageSchema(page.currentVersion?.generatedSchemaJson);
  if (!parsedSchema.success) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  const schema = parsedSchema.data;
  const seoTitle = schema.seo.title.trim();
  const seoDescription = schema.seo.description.trim();
  const canonicalUrl = schema.seo.canonicalUrl?.trim();
  const ogImageAssetId = schema.seo.ogImageAssetId?.trim();
  const ogImageAsset = ogImageAssetId
    ? page.assets.find((asset) => asset.id === ogImageAssetId)
    : undefined;

  return {
    title: seoTitle || fallbackTitle,
    description: seoDescription || fallbackDescription,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: ogImageAsset
      ? {
          images: [
            {
              url: ogImageAsset.storageUrl,
              alt: seoTitle || fallbackTitle,
            },
          ],
        }
      : undefined,
  };
}

function InvalidSchemaFallback({ publicSlug }: { publicSlug: string }) {
  return (
    <Container width="content" className="space-y-4 py-12">
      <h1 className="text-3xl font-bold text-fg">Page preview unavailable</h1>
      <p className="text-muted">
        The published page for <span className="font-mono">{publicSlug}</span> has an invalid
        generated schema.
      </p>
      <p className="text-muted">Please rebuild or publish another version from the dashboard.</p>
    </Container>
  );
}

function normalizeLayout(schema: GeneratedPageSchema): GeneratedPageLayout {
  if (schema.layout) {
    return schema.layout;
  }

  const contentBlockIds = (schema.blocks ?? schema.sections)
    .map((block) => block.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  return {
    top: [{ id: "shell-page-header", type: "pageHeader" }],
    main: contentBlockIds,
    bottom: [{ id: "shell-widget-embed", type: "widgetEmbed" }, { id: "shell-build-meta", type: "buildMeta" }],
  };
}

function PageHeaderBlock({
  schema,
  pageTitleFallback,
  logoAsset,
}: {
  schema: GeneratedPageSchema;
  pageTitleFallback: string;
  logoAsset: DemoLayoutContext["logoAsset"];
}) {
  const normalizedHeaderAlignment =
    schema.pageHeaderAlignment?.trim().toLowerCase() === "center" ? "center" : "left";
  const isPageHeaderCentered = normalizedHeaderAlignment === "center";

  return (
    <header
      className={`max-w-3xl space-y-4 ${isPageHeaderCentered ? "mx-auto text-center" : "text-left"}`}
    >
      {logoAsset ? (
        <div className={`relative h-12 w-28 sm:h-14 sm:w-32 ${isPageHeaderCentered ? "mx-auto" : ""}`}>
          <Image
            src={logoAsset.storageUrl}
            alt={logoAsset.fileName || "Brand logo"}
            fill
            unoptimized
            sizes="(max-width: 640px) 112px, 128px"
            className="object-contain"
          />
        </div>
      ) : null}
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--dbp-ink)] sm:text-4xl lg:text-5xl">
        {schema.pageTitle || pageTitleFallback}
      </h1>
      {schema.summary ? (
        <p className="text-pretty text-base leading-7 text-[var(--dbp-muted)] sm:text-lg">{schema.summary}</p>
      ) : null}
    </header>
  );
}

function BuildMetaBlock({ schema, currentVersionLabel }: { schema: GeneratedPageSchema; currentVersionLabel: string }) {
  return (
    <footer className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-xs text-muted sm:px-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="font-medium text-fg">Build {currentVersionLabel}</span>
        <span>Theme:</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: schema.theme.primaryColor }}
            aria-hidden
          />
          <code>{schema.theme.primaryColor}</code>
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: schema.theme.accentColor }}
            aria-hidden
          />
          <code>{schema.theme.accentColor}</code>
        </span>
        <span>Font: {schema.theme.fontFamily}</span>
      </div>
    </footer>
  );
}

function renderLayoutRegion(region: DemoLayoutRegion, entries: DemoLayoutEntry[], context: DemoLayoutContext): ReactNode {
  const contentById = new Map((context.schema.blocks ?? context.schema.sections).map((block) => [block.id, block]));
  const resolvedContentBlocks: GeneratedBlock[] = [];
  const output: ReactNode[] = [];
  const flushContentBlocks = (keyBase: string) => {
    if (resolvedContentBlocks.length === 0) {
      return;
    }

    output.push(
      <PageRenderer
        key={`${keyBase}-${output.length}`}
        page={{ ...context.schema, blocks: [...resolvedContentBlocks], sections: [...resolvedContentBlocks] }}
        resolveAsset={context.resolveAsset}
      />,
    );
    resolvedContentBlocks.length = 0;
  };

  entries.forEach((entry, index) => {
    const maybeReferencedBlock =
      typeof entry === "string"
        ? contentById.get(entry)
        : typeof entry.type === "string" && entry.type !== "pageHeader" && entry.type !== "widgetEmbed" && entry.type !== "buildMeta"
          ? entry
          : null;

    if (maybeReferencedBlock) {
      resolvedContentBlocks.push(maybeReferencedBlock);
      return;
    }

    flushContentBlocks(`${region}-${index}`);
    const block = typeof entry === "string" ? null : entry;
    const blockType = block?.type?.trim();

    if (blockType === "pageHeader") {
      output.push(
        <PageHeaderBlock
          key={`${region}-${index}-page-header`}
          schema={context.schema}
          pageTitleFallback={context.page?.title ?? SITE_DEFAULT_TITLE}
          logoAsset={context.logoAsset}
        />,
      );
      return;
    }

    if (blockType === "widgetEmbed") {
      output.push(
        context.page?.widgetEmbedHtml ? (
          <WidgetEmbed key={`${region}-${index}-widget-embed`} html={context.page.widgetEmbedHtml} />
        ) : null,
      );
      return;
    }

    if (blockType === "buildMeta") {
      output.push(
        <BuildMetaBlock
          key={`${region}-${index}-build-meta`}
          schema={context.schema}
          currentVersionLabel={context.currentVersionLabel}
        />,
      );
      return;
    }
  });

  flushContentBlocks(`${region}-tail`);
  return output;
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;

  const page = await getPublishedDemoPage({ publicSlug: slug });

  if (!page) {
    notFound();
  }

  const parsedSchema = validateGeneratedPageSchema(page.currentVersion?.generatedSchemaJson);

  if (!parsedSchema.success) {
    return <InvalidSchemaFallback publicSlug={page.publicSlug} />;
  }

  const assetLookup: AssetLookupMap = new Map(
    page.assets.map((asset) => [
      asset.id,
      {
        id: asset.id,
        storageUrl: asset.storageUrl,
        metadata:
          asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata)
            ? (asset.metadata as Record<string, unknown>)
            : {},
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      },
    ]),
  );

  const schema: GeneratedPageSchema = parsedSchema.data;
  const resolveAsset: AssetResolver = (assetId) => assetLookup.get(assetId) ?? null;
  const logoAsset = page.assets.find(
    (asset) => asset.type === "logo" && asset.mimeType.startsWith("image/"),
  );
  const currentVersionLabel = page.currentVersion?.versionNumber
    ? `v${page.currentVersion.versionNumber}`
    : "v?";
  const layout = normalizeLayout(schema);
  const themeVariables = {
    "--dbp-primary": schema.theme.primaryColor,
    "--dbp-accent": schema.theme.accentColor,
    "--dbp-ink": schema.theme.primaryColor,
    "--dbp-muted": "color-mix(in srgb, var(--dbp-ink) 70%, #475569)",
    "--dbp-border": "color-mix(in srgb, var(--dbp-primary) 18%, #cbd5e1)",
    "--dbp-surface": "#ffffff",
    "--dbp-surface-muted": "color-mix(in srgb, var(--dbp-accent) 8%, #f8fafc)",
  } as CSSProperties;

  return (
    <div style={themeVariables}>
      <Container className="space-y-10 py-10 sm:space-y-12 sm:py-12 lg:space-y-14 lg:py-16">
        {renderLayoutRegion("top", layout.top, {
          page,
          schema,
          logoAsset,
          resolveAsset,
          currentVersionLabel,
        })}
        {renderLayoutRegion("main", layout.main, {
          page,
          schema,
          logoAsset,
          resolveAsset,
          currentVersionLabel,
        })}
        {renderLayoutRegion("bottom", layout.bottom, {
          page,
          schema,
          logoAsset,
          resolveAsset,
          currentVersionLabel,
        })}
      </Container>
    </div>
  );
}
