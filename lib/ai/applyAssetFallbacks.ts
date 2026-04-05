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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMediaAssetIdsFromBlock(block: GeneratedPageSchema["blocks"][number]): string[] {
  if (Array.isArray(block.mediaAssetIds)) {
    return block.mediaAssetIds.filter((id): id is string => typeof id === "string");
  }

  if (isRecord(block.props) && Array.isArray(block.props.mediaAssetIds)) {
    return block.props.mediaAssetIds.filter((id): id is string => typeof id === "string");
  }

  return [];
}

function setMediaAssetIdsOnBlock(
  block: GeneratedPageSchema["blocks"][number],
  mediaAssetIds: string[],
): GeneratedPageSchema["blocks"][number] {
  const nextProps = isRecord(block.props) ? block.props : {};

  return {
    ...block,
    mediaAssetIds,
    props: {
      ...nextProps,
      mediaAssetIds,
    },
  };
}

export function applyAssetFallbacks(schema: GeneratedPageSchema, assets: AssetRecord[]): GeneratedPageSchema {
  const allAssetIds = new Set(assets.map((asset) => asset.id));
  const imageAssets = assets.filter((asset) => isImageAsset(asset));
  const imageAssetIds = new Set(imageAssets.map((asset) => asset.id));
  const logoImageAssets = imageAssets.filter((asset) => asset.type === "logo");
  const nonLogoImageAssets = imageAssets.filter((asset) => asset.type !== "logo");

  const fallbackPrimaryImageId = nonLogoImageAssets[0]?.id ?? imageAssets[0]?.id;

  const sourceBlocks = schema.blocks ?? schema.sections ?? [];
  const nextBlocks = sourceBlocks.map((section) => {
    if (!VISUAL_SECTION_TYPES.has(section.type)) {
      return section;
    }

    const validExistingIds = getMediaAssetIdsFromBlock(section).filter((id) => imageAssetIds.has(id));
    if (validExistingIds.length > 0) {
      return setMediaAssetIdsOnBlock(section, validExistingIds);
    }

    if (section.type === "logoStrip") {
      const logoIds = logoImageAssets.map((asset) => asset.id);
      return logoIds.length > 0
        ? setMediaAssetIdsOnBlock(section, logoIds)
        : section;
    }

    if (section.type === "gallery") {
      const galleryIds = (nonLogoImageAssets.length > 0 ? nonLogoImageAssets : imageAssets)
        .slice(0, 6)
        .map((asset) => asset.id);
      return galleryIds.length > 0 ? setMediaAssetIdsOnBlock(section, galleryIds) : section;
    }

    if (!fallbackPrimaryImageId) {
      return section;
    }

    return setMediaAssetIdsOnBlock(section, [fallbackPrimaryImageId]);
  });

  const hasValidOgImageId =
    typeof schema.seo.ogImageAssetId === "string" && allAssetIds.has(schema.seo.ogImageAssetId);

  return {
    ...schema,
    seo: {
      ...schema.seo,
      ...(hasValidOgImageId || !fallbackPrimaryImageId ? {} : { ogImageAssetId: fallbackPrimaryImageId }),
    },
    blocks: nextBlocks,
    sections: nextBlocks,
  };
}
