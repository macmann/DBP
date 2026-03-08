import type { AssetType } from "@prisma/client";
import type { AllowedSectionType } from "@/lib/ai/schema";

type PromptAsset = {
  id: string;
  type: AssetType;
  storageUrl: string;
  metadata: unknown;
  fileName: string;
  mimeType: string;
};

export type BuildPromptInput = {
  pagePrompt: string;
  referenceLinks: string[];
  assets: PromptAsset[];
  allowedSections: readonly AllowedSectionType[];
  toneBrandingHints: string[];
};

export function buildPageGenerationPrompts(input: BuildPromptInput) {
  const systemPrompt = [
    "You are a landing page schema generator.",
    "Respond with JSON only. Do not include markdown fences or prose.",
    "Use only allowed section types provided by the caller.",
    "For any media references, only use provided mediaAssetIds.",
  ].join("\n");

  const userPrompt = [
    `Page prompt:\n${input.pagePrompt || "(none provided)"}`,
    `Allowed sections:\n${input.allowedSections.join(", ")}`,
    `Tone and branding hints:\n${input.toneBrandingHints.join("\n") || "(none provided)"}`,
    `Reference links:\n${input.referenceLinks.length > 0 ? input.referenceLinks.join("\n") : "(none provided)"}`,
    `Uploaded assets:\n${
      input.assets.length > 0
        ? input.assets
            .map((asset) =>
              JSON.stringify({
                id: asset.id,
                type: asset.type,
                storageUrl: asset.storageUrl,
                fileName: asset.fileName,
                mimeType: asset.mimeType,
                metadata: asset.metadata,
              }),
            )
            .join("\n")
        : "(none provided)"
    }`,
    "Return JSON shape: { pageTitle: string, summary?: string, sections: Array<{ id: string, type: allowedType, heading?: string, body?: string, items?: object[], mediaAssetIds?: string[], cta?: { label: string, href: string } }> }.",
  ].join("\n\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
