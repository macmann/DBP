import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PageRenderer } from "@/components/landing/PageRenderer";
import { WidgetEmbed } from "@/components/landing/WidgetEmbed";
import type { AssetResolver, ResolvedAsset } from "@/components/landing/types";
import { type GeneratedPageSchema, validateGeneratedPageSchema } from "@/lib/ai/schema";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/lib/config/brand";
import { getPublishedDemoPage } from "@/lib/public-pages";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

type AssetLookupMap = Map<string, ResolvedAsset>;

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

  return (
    <Container className="space-y-10 py-10 sm:space-y-12 sm:py-12 lg:space-y-14 lg:py-16">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        {logoAsset ? (
          <div className="relative mx-auto h-12 w-28 sm:h-14 sm:w-32">
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
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl lg:text-5xl">
          {schema.pageTitle || page.title}
        </h1>
        {schema.summary ? (
          <p className="text-pretty text-base leading-7 text-muted sm:text-lg">{schema.summary}</p>
        ) : null}
      </header>
      <PageRenderer page={schema} resolveAsset={resolveAsset} />
      {page.widgetEmbedHtml ? <WidgetEmbed html={page.widgetEmbedHtml} /> : null}
    </Container>
  );
}
