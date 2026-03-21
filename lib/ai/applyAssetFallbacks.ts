import type { GeneratedPageSchema } from "@/lib/ai/schema";

type AssetRecord = {
  id: string;
  type: string;
  mimeType: string;
};

const VISUAL_SECTION_TYPES = new Set(["hero", "imageText", "gallery", "logoStrip", "testimonial"]);

function isImageAsset(asset: AssetRecord): boolean {
  return asset.mimeType.startsWith("image/");
}

export function applyAssetFallbacks(schema: GeneratedPageSchema, assets: AssetRecord[]): GeneratedPageSchema {
  const allAssetIds = new Set(assets.map((asset) => asset.id));
  const imageAssets = assets.filter((asset) => isImageAsset(asset));
  const imageAssetIds = new Set(imageAssets.map((asset) => asset.id));
  const logoImageAssets = imageAssets.filter((asset) => asset.type === "logo");
  const nonLogoImageAssets = imageAssets.filter((asset) => asset.type !== "logo");

  const fallbackPrimaryImageId = nonLogoImageAssets[0]?.id ?? imageAssets[0]?.id;

  const nextSections = schema.sections.map((section) => {
    if (!VISUAL_SECTION_TYPES.has(section.type)) {
      return section;
    }

    const validExistingIds = (section.mediaAssetIds ?? []).filter((id) => imageAssetIds.has(id));
    if (validExistingIds.length > 0) {
      return {
        ...section,
        mediaAssetIds: validExistingIds,
      };
    }

    if (section.type === "logoStrip") {
      const logoIds = logoImageAssets.map((asset) => asset.id);
      return logoIds.length > 0
        ? {
            ...section,
            mediaAssetIds: logoIds,
          }
        : section;
    }

    if (section.type === "gallery") {
      const galleryIds = (nonLogoImageAssets.length > 0 ? nonLogoImageAssets : imageAssets)
        .slice(0, 6)
        .map((asset) => asset.id);
      return galleryIds.length > 0
        ? {
            ...section,
            mediaAssetIds: galleryIds,
          }
        : section;
    }

    if (!fallbackPrimaryImageId) {
      return section;
    }

    return {
      ...section,
      mediaAssetIds: [fallbackPrimaryImageId],
    };
  });

  const hasValidOgImageId =
    typeof schema.seo.ogImageAssetId === "string" && allAssetIds.has(schema.seo.ogImageAssetId);

  return {
    ...schema,
    seo: {
      ...schema.seo,
      ...(hasValidOgImageId || !fallbackPrimaryImageId ? {} : { ogImageAssetId: fallbackPrimaryImageId }),
    },
    sections: nextSections,
  };
}
