import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Container } from "@/components/layout/Container";
import { registerBlock } from "@/components/landing/blockRegistry";
import { PageRenderer } from "@/components/landing/PageRenderer";
import { WidgetEmbed } from "@/components/landing/WidgetEmbed";
import type { AssetResolver, ResolvedAsset } from "@/components/landing/types";
import type { GeneratedBlock, GeneratedPageSchema } from "@/lib/ai/schema";
import { validateGeneratedPageSchema } from "@/lib/ai/schema";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/lib/config/brand";
import { getPublishedDemoPage } from "@/lib/public-pages";
import { buildDemoRenderSchema } from "./demoLayout";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

type AssetLookupMap = Map<string, ResolvedAsset>;
type DemoPublishedPage = NonNullable<Awaited<ReturnType<typeof getPublishedDemoPage>>>;

const SITE_DEFAULT_TITLE = PRODUCT_NAME;
const SITE_DEFAULT_DESCRIPTION = PRODUCT_DESCRIPTION;

let demoShellBlocksRegistered = false;

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


function PageHeaderBlock({ block }: { block: GeneratedBlock }) {
  const props = block.props && typeof block.props === "object" ? block.props : {};
  const normalizedHeaderAlignment =
    typeof props.alignment === "string" && props.alignment.trim().toLowerCase() === "center"
      ? "center"
      : "left";
  const isPageHeaderCentered = normalizedHeaderAlignment === "center";
  const logoAssetUrl = typeof props.logoAssetUrl === "string" ? props.logoAssetUrl : "";
  const logoAssetFileName =
    typeof props.logoAssetFileName === "string" && props.logoAssetFileName.trim().length > 0
      ? props.logoAssetFileName
      : "Brand logo";
  const pageTitle = typeof props.pageTitle === "string" ? props.pageTitle : SITE_DEFAULT_TITLE;
  const summary = typeof props.summary === "string" ? props.summary : "";

  return (
    <header
      className={`max-w-3xl space-y-4 ${isPageHeaderCentered ? "mx-auto text-center" : "text-left"}`}
    >
      {logoAssetUrl ? (
        <div className={`relative h-12 w-28 sm:h-14 sm:w-32 ${isPageHeaderCentered ? "mx-auto" : ""}`}>
          <Image
            src={logoAssetUrl}
            alt={logoAssetFileName}
            fill
            unoptimized
            sizes="(max-width: 640px) 112px, 128px"
            className="object-contain"
          />
        </div>
      ) : null}
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--dbp-ink)] sm:text-4xl lg:text-5xl">
        {pageTitle}
      </h1>
      {summary ? (
        <p className="text-pretty text-base leading-7 text-[var(--dbp-muted)] sm:text-lg">{summary}</p>
      ) : null}
    </header>
  );
}

function BuildMetaBlock({ block }: { block: GeneratedBlock }) {
  const props = block.props && typeof block.props === "object" ? block.props : {};
  const currentVersionLabel =
    typeof props.currentVersionLabel === "string" && props.currentVersionLabel.trim().length > 0
      ? props.currentVersionLabel
      : "v?";
  const primaryColor = typeof props.primaryColor === "string" ? props.primaryColor : "#111827";
  const accentColor = typeof props.accentColor === "string" ? props.accentColor : "#3B82F6";
  const fontFamily = typeof props.fontFamily === "string" ? props.fontFamily : "Inter";

  return (
    <footer className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-xs text-muted sm:px-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="font-medium text-fg">Build {currentVersionLabel}</span>
        <span>Theme:</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: primaryColor }}
            aria-hidden
          />
          <code>{primaryColor}</code>
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          <code>{accentColor}</code>
        </span>
        <span>Font: {fontFamily}</span>
      </div>
    </footer>
  );
}

function WidgetEmbedBlock({ block }: { block: GeneratedBlock }) {
  const props = block.props && typeof block.props === "object" ? block.props : {};
  const html = typeof props.html === "string" ? props.html : "";

  if (!html) {
    return null;
  }

  return <WidgetEmbed html={html} />;
}

function registerDemoShellBlocks() {
  if (demoShellBlocksRegistered) {
    return;
  }

  registerBlock("pageHeader", ({ block }) => <PageHeaderBlock block={block} />);
  registerBlock("buildMeta", ({ block }) => <BuildMetaBlock block={block} />);
  registerBlock("widgetEmbed", ({ block }) => <WidgetEmbedBlock block={block} />);

  demoShellBlocksRegistered = true;
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

  registerDemoShellBlocks();

  const renderSchema = buildDemoRenderSchema(schema, {
    pageTitleFallback: page.title || SITE_DEFAULT_TITLE,
    currentVersionLabel,
    widgetEmbedHtml: page.widgetEmbedHtml,
    logoAsset: logoAsset
      ? {
          storageUrl: logoAsset.storageUrl,
          fileName: logoAsset.fileName,
        }
      : undefined,
  });
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
        <PageRenderer page={renderSchema} resolveAsset={resolveAsset} />
      </Container>
    </div>
  );
}
