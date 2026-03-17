import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/landing/PageRenderer";
import type { AssetResolver, ResolvedAsset } from "@/components/landing/types";
import { type GeneratedPageSchema, validateGeneratedPageSchema } from "@/lib/ai/schema";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/lib/config/brand";
import { prisma } from "@/lib/db";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

type AssetLookupMap = Map<string, ResolvedAsset>;

const SITE_DEFAULT_TITLE = PRODUCT_NAME;
const SITE_DEFAULT_DESCRIPTION = PRODUCT_DESCRIPTION;

async function getPublishedDemoPage(publicSlug: string) {
  const page = await prisma.page.findFirst({
    where: {
      publicSlug,
      status: "published",
    },
    select: {
      id: true,
      publicSlug: true,
      title: true,
      currentVersion: {
        select: {
          generatedSchemaJson: true,
        },
      },
    },
  });

  if (!page) {
    return null;
  }

  const assets = await prisma.asset.findMany({
    where: {
      pageId: page.id,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      storageUrl: true,
      metadata: true,
      fileName: true,
      mimeType: true,
    },
  });

  return {
    ...page,
    assets,
  };
}

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedDemoPage(slug);

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
    <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Page preview unavailable</h1>
      <p className="text-neutral-700">
        The published page for <span className="font-mono">{publicSlug}</span> has an invalid generated schema.
      </p>
      <p className="text-neutral-700">Please rebuild or publish another version from the dashboard.</p>
    </main>
  );
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;

  const page = await getPublishedDemoPage(slug);

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

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-neutral-900">{schema.pageTitle || page.title}</h1>
        {schema.summary ? <p className="text-lg text-neutral-700">{schema.summary}</p> : null}
      </header>
      <PageRenderer page={schema} resolveAsset={resolveAsset} />
    </main>
  );
}
