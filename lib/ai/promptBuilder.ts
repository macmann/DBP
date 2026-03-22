import type { AssetType } from "@prisma/client";
import type { AllowedSectionType } from "./schema";

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
    "Output JSON only (no markdown, no prose, no explanations).",
    "Return exactly one JSON object with only these top-level keys: pageTitle, summary (optional), theme, seo, sections.",
    "theme, seo, and sections are required and must be valid objects/array.",
    "seo.title must be 70 characters or fewer.",
    "seo.description must be 160 characters or fewer.",
    "Every sections[].cta.href must be either an absolute http(s) URL or a root-relative path that starts with '/'.",
    "Use only section types from the allowed list.",
    "Any media references (section mediaAssetIds, seo.ogImageAssetId) must use uploaded asset.id values only.",
    "If uploaded image/logo assets are provided, assign relevant section.mediaAssetIds for visual sections (hero, imageText, gallery, logoStrip, testimonial).",
    "Pick assets by semantic fit from fileName/type/metadata so the demo renders real images instead of fallback placeholders.",
    "Section selection, section order, and content hierarchy must follow the page prompt and not default to a fixed boilerplate sequence.",
    "Treat the page prompt as the source of truth for layout instructions: vary section types, ordering, density, and narrative flow based on the prompt.",
    "Do not reuse a default blueprint. If two prompts differ, the resulting section plan should differ in structure, not only copy or colors.",
    "When the prompt requests a specific layout pattern (for example split hero, comparison grid, FAQ-first, long-form storytelling), reflect that in the section sequence and section content.",
    "Set sections[].layoutVariant when useful so the renderer can apply explicit layout intent (examples: split, centered, media-left, media-right, cards-2, cards-3, cards-4, alternating, stacked).",
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
    '      "layoutVariant?": "string // optional layout instruction token for renderer",',
    '      "heading?": "string // section heading",',
    '      "body?": "string // section body",',
    '      "items?": "object[] // structured content items",',
    '      "mediaAssetIds?": "string[] // every id must match uploaded asset.id",',
    '      "cta?": { "label": "string", "href": "string" }',
    "    }",
    "  ]",
    "}",
    "Do not output any text before or after the JSON object.",
    "Use only the keys above and only allowed section types.",
    "Important: layout must be instruction-driven from the Page prompt, not template-driven.",
  ].join("\n\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
