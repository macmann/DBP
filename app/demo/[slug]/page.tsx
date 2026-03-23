import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Container } from "@/components/layout/Container";
import { PageRenderer } from "@/components/landing/PageRenderer";
import { registerShellBlocks } from "@/components/landing/shellBlocks";
import type { AssetResolver, ResolvedAsset } from "@/components/landing/types";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
import { normalizeGeneratedSchemaForRuntime } from "@/lib/ai/schemaMigration";
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

  const parsedSchema = normalizeGeneratedSchemaForRuntime(page.currentVersion?.generatedSchemaJson);
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

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;

  const page = await getPublishedDemoPage({ publicSlug: slug });

  if (!page) {
    notFound();
  }

  const parsedSchema = normalizeGeneratedSchemaForRuntime(page.currentVersion?.generatedSchemaJson);

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

  registerShellBlocks();

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
      <Container className="py-10 sm:py-12 lg:py-16">
        <PageRenderer page={renderSchema} resolveAsset={resolveAsset} />
      </Container>
    </div>
  );
}
