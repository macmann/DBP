import type { GeneratedSection } from "@/lib/ai/schema";

export type ResolvedAsset = {
  id: string;
  storageUrl: string;
  fileName: string;
  mimeType: string;
  metadata: Record<string, unknown>;
};

export type AssetResolver = (assetId: string) => ResolvedAsset | null;

export type SectionRenderProps = {
  section: GeneratedSection;
  resolveAsset: AssetResolver;
};

export function getHeading(section: GeneratedSection): string | null {
  return typeof section.heading === "string" && section.heading.trim().length > 0
    ? section.heading
    : null;
}

export function getBody(section: GeneratedSection): string | null {
  return typeof section.body === "string" && section.body.trim().length > 0 ? section.body : null;
}

export function getCta(section: GeneratedSection): { label: string; href: string } | null {
  if (!section.cta) {
    return null;
  }

  if (typeof section.cta.label !== "string" || typeof section.cta.href !== "string") {
    return null;
  }

  const label = section.cta.label.trim();
  const href = section.cta.href.trim();

  if (!label || !href) {
    return null;
  }

  return {
    label,
    href,
  };
}

export function getItems(section: GeneratedSection): Array<Record<string, unknown>> {
  if (!Array.isArray(section.items)) {
    return [];
  }

  return section.items.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item),
  );
}

export function getMediaAssetIds(section: GeneratedSection): string[] {
  if (!Array.isArray(section.mediaAssetIds)) {
    return [];
  }

  return section.mediaAssetIds.filter((assetId): assetId is string => typeof assetId === "string");
}

export function resolveMediaAssets(
  section: GeneratedSection,
  resolveAsset: AssetResolver,
): ResolvedAsset[] {
  return getMediaAssetIds(section)
    .map((assetId) => resolveAsset(assetId))
    .filter((asset): asset is ResolvedAsset => Boolean(asset));
}

export function getString(item: Record<string, unknown>, key: string): string | null {
  const value = item[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
