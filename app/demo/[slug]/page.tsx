import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  type GeneratedPageSchema,
  type GeneratedSection,
  validateGeneratedPageSchema,
} from "@/lib/ai/schema";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

type AssetLookupEntry = {
  storageUrl: string;
  metadata: Record<string, unknown>;
  fileName: string;
  mimeType: string;
};

type AssetLookupMap = Map<string, AssetLookupEntry>;

function resolveAssetEntries(assetIds: string[] | undefined, assetLookup: AssetLookupMap) {
  if (!assetIds || assetIds.length === 0) {
    return [];
  }

  return assetIds
    .map((assetId) => ({
      assetId,
      asset: assetLookup.get(assetId),
    }))
    .filter((entry): entry is { assetId: string; asset: AssetLookupEntry } => Boolean(entry.asset));
}

function SectionRenderer({ section, assetLookup }: { section: GeneratedSection; assetLookup: AssetLookupMap }) {
  const linkedAssets = resolveAssetEntries(section.mediaAssetIds, assetLookup);

  return (
    <section key={section.id} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{section.type}</p>
      {section.heading ? <h2 className="text-2xl font-semibold text-neutral-900">{section.heading}</h2> : null}
      {section.body ? <p className="text-base leading-relaxed text-neutral-700">{section.body}</p> : null}

      {Array.isArray(section.items) && section.items.length > 0 ? (
        <ul className="list-disc space-y-1 pl-6 text-sm text-neutral-700">
          {section.items.map((item, index) => (
            <li key={`${section.id}-item-${index}`}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : null}

      {section.cta ? (
        <a
          href={section.cta.href}
          className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {section.cta.label}
        </a>
      ) : null}

      {linkedAssets.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {linkedAssets.map(({ assetId, asset }) => (
            <article key={`${section.id}-${assetId}`} className="rounded-lg border border-neutral-200 p-3">
              {asset.mimeType.startsWith("image/") ? (
                <img src={asset.storageUrl} alt={asset.fileName} className="h-48 w-full rounded object-cover" />
              ) : (
                <a href={asset.storageUrl} className="text-sm underline" target="_blank" rel="noreferrer">
                  Open asset
                </a>
              )}
              <p className="mt-2 text-sm font-medium text-neutral-800">{asset.fileName}</p>
              {Object.keys(asset.metadata).length > 0 ? (
                <pre className="mt-1 overflow-auto rounded bg-neutral-50 p-2 text-xs text-neutral-600">
                  {JSON.stringify(asset.metadata, null, 2)}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function InvalidSchemaFallback({ slug }: { slug: string }) {
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-6 py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Page preview unavailable</h1>
      <p className="text-neutral-700">
        The published page for <span className="font-mono">{slug}</span> has an invalid generated schema.
      </p>
      <p className="text-neutral-700">Please rebuild or publish another version from the dashboard.</p>
    </main>
  );
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: {
      slug,
      status: "published",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      currentVersion: {
        select: {
          generatedSchemaJson: true,
        },
      },
      assets: {
        where: {
          pageId: {
            not: null,
          },
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
      },
    },
  });

  if (!page) {
    notFound();
  }

  const parsedSchema = validateGeneratedPageSchema(page.currentVersion?.generatedSchemaJson);

  if (!parsedSchema.success) {
    return <InvalidSchemaFallback slug={page.slug} />;
  }

  const assetLookup: AssetLookupMap = new Map(
    page.assets.map((asset) => [
      asset.id,
      {
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

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-neutral-900">{schema.pageTitle || page.title}</h1>
        {schema.summary ? <p className="text-lg text-neutral-700">{schema.summary}</p> : null}
      </header>
      {schema.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} assetLookup={assetLookup} />
      ))}
    </main>
  );
}
