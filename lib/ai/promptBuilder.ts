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
    "Output JSON only (no markdown, no prose).",
    "Return exactly the agreed schema keys; do not add any extra keys.",
    "Always include theme, seo, and sections.",
    "Use only section types from the allowed list.",
    "Any media references (section mediaAssetIds, seo.ogImageAssetId) must use uploaded asset.id values only.",
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
    "Return this exact JSON shape (required keys: pageTitle, theme, seo, sections; optional keys shown with ?):",
    "{",
    '  "pageTitle": "string // page title",',
    '  "summary?": "string // short page summary",',
    '  "theme": {',
    '    "primaryColor": "string // hex or token",',
    '    "accentColor": "string // hex or token",',
    '    "fontFamily": "string // font stack",',
    '    "spacing?": "string // spacing scale",',
    '    "radius?": "string // corner radius scale"',
    "  },",
    '  "seo": {',
    '    "title": "string // SEO title",',
    '    "description": "string // SEO description",',
    '    "canonicalUrl?": "string // absolute URL",',
    '    "ogImageAssetId?": "string // must match an uploaded asset.id"',
    "  },",
    '  "sections": [',
    "    {",
    '      "id": "string // stable section id",',
    '      "type": "allowedType // must be from Allowed sections",',
    '      "heading?": "string // section heading",',
    '      "body?": "string // section body",',
    '      "items?": "object[] // structured content items",',
    '      "mediaAssetIds?": "string[] // every id must match uploaded asset.id",',
    '      "cta?": { "label": "string", "href": "string" }',
    "    }",
    "  ]",
    "}",
    "Use only the keys above and only allowed section types.",
  ].join("\n\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
