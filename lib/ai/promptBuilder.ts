import type { AssetType } from "@prisma/client";

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
  allowedBlockTypes?: readonly string[];
  toneBrandingHints: string[];
  layoutRegions: readonly string[];
};

export function buildPageGenerationPrompts(input: BuildPromptInput) {
  const layoutRegions = input.layoutRegions.filter((region) => region.trim().length > 0);
  const layoutRegionKeys = layoutRegions.length > 0 ? layoutRegions : ["top", "main", "bottom"];
  const layoutRegionInstructionTokens = layoutRegionKeys.map((region) => `layout.${region}`);
  const layoutRegionInstructions =
    layoutRegionInstructionTokens.length === 1
      ? layoutRegionInstructionTokens[0]
      : `${layoutRegionInstructionTokens.slice(0, -1).join(", ")}, and ${
          layoutRegionInstructionTokens[layoutRegionInstructionTokens.length - 1]
        }`;
  const layoutSampleEntries = layoutRegionKeys.map((region, index) => {
    if (index === 0) {
      return `    "${region}": ["hero-main"]`;
    }
    if (index === 1) {
      return `    "${region}": ["features-grid"]`;
    }
    return `    "${region}": []`;
  });

  const systemPrompt = [
    "You are a landing page schema generator.",
    "Output JSON only (no markdown, no prose, no explanations).",
    "Return exactly one JSON object with only these top-level keys: schemaVersion, pageTitle, summary (optional), pageHeaderAlignment (optional), theme, seo, blocks, layout.",
    "schemaVersion, theme, seo, blocks, and layout are required and must be valid values.",
    "schemaVersion must be 2.",
    "The response contract is block/layout based only: blocks[] define content units and layout maps placement by block ID or inline block objects.",
    "seo.title must be 70 characters or fewer.",
    "seo.description must be 160 characters or fewer.",
    "Every blocks[].props.cta.href must be either an absolute http(s) URL or a root-relative path that starts with '/'.",
    "Prefer block types implied by the page prompt and keep type names URL-safe tokens.",
    "Each blocks[] entry must include id and type. variant and props are optional.",
    "Any media references (blocks[].props.mediaAssetIds, seo.ogImageAssetId) must use uploaded asset.id values only.",
    "If uploaded image/logo assets are provided, assign relevant blocks[].props.mediaAssetIds for visual blocks (hero, imageText, gallery, logoStrip, testimonial).",
    "Pick assets by semantic fit from fileName/type/metadata so the demo renders real images instead of fallback placeholders.",
    "Block selection, block order, and content hierarchy must follow the page prompt and not default to a fixed boilerplate sequence.",
    "Treat the page prompt as the source of truth for layout instructions: vary block types, ordering, density, and narrative flow based on the prompt.",
    "Do not reuse a default blueprint. If two prompts differ, the resulting block plan should differ in structure, not only copy or colors.",
    "When the prompt requests a specific layout pattern (for example split hero, comparison grid, FAQ-first, long-form storytelling), reflect that in block sequencing, block variants, and props content.",
    "Set blocks[].variant when useful so the renderer can apply explicit layout intent (examples: split, centered, media-left, media-right, cards-2, cards-3, cards-4, alternating, stacked).",
    "Preserve deterministic JSON constraints while increasing semantic diversity: vary composition and copy strategy without inventing non-schema keys.",
    `${layoutRegionInstructions} must be arrays containing block IDs and/or inline block objects ({ id, type, variant?, props? }).`,
  ].join("\n");

  const userPrompt = [
    `Page prompt:\n${input.pagePrompt || "(none provided)"}`,
    `Prompt-suggested block types:\n${(input.allowedBlockTypes ?? []).join(", ") || "(derive from page prompt)"}`,
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
    "Return this exact JSON shape (required keys: schemaVersion, pageTitle, theme, seo, blocks, layout; optional keys shown with ?):",
    "{",
    '  "schemaVersion": 2,',
    '  "pageTitle": "string // page title",',
    '  "summary?": "string // short page summary",',
    '  "pageHeaderAlignment?": "left | center // controls top page header alignment",',
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
    '  "blocks": [',
    "    {",
    '      "id": "hero-main",',
    '      "type": "hero",',
    '      "variant?": "split",',
    '      "props?": { "...": "..." }',
    "    },",
    "    {",
    '      "id": "features-grid",',
    '      "type": "feature-grid",',
    '      "variant?": "cards-3",',
    '      "props?": { "...": "..." }',
    "    }",
    "  ],",
    '  "layout": {',
    `${layoutSampleEntries.join(",\n")}`,
    "  }",
    "}",
    "Do not output any text before or after the JSON object.",
    "Use only the keys above. Block type names should be URL-safe and prompt-driven.",
    "Ensure every string layout ID exists in blocks[].id. Inline layout blocks must provide unique id and valid type.",
    "Important: layout must be instruction-driven from the Page prompt, not template-driven.",
  ].join("\n\n");

  return {
    systemPrompt,
    userPrompt,
  };
}
