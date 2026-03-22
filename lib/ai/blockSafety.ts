import type { GeneratedBlock, GeneratedPageSchema } from "@/lib/ai/schema";

const URL_PROP_KEYS = new Set([
  "href",
  "src",
  "url",
  "link",
  "poster",
  "action",
  "formAction",
]);

const HTML_PROP_KEYS = new Set([
  "html",
  "embedHtml",
  "innerHtml",
  "markup",
  "script",
]);

const ALLOWED_EMBED_BLOCK_TYPES = new Set(["widgetEmbed"]);
const DENIED_EMBED_BLOCK_TYPES = new Set([
  "embed",
  "iframe",
  "scriptEmbed",
  "htmlEmbed",
  "rawHtml",
]);

export type BlockSafetyPolicy = {
  allowedEmbedBlockTypes: ReadonlySet<string>;
  deniedEmbedBlockTypes: ReadonlySet<string>;
};

export const BLOCK_SAFETY_POLICY: BlockSafetyPolicy = {
  allowedEmbedBlockTypes: ALLOWED_EMBED_BLOCK_TYPES,
  deniedEmbedBlockTypes: DENIED_EMBED_BLOCK_TYPES,
};

export type SanitizeBlockSafetyOptions = {
  allowedInlineHtmlBlockTypes?: readonly string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmbedLikeType(type: string): boolean {
  const normalizedType = type.trim().toLowerCase();
  return (
    normalizedType.includes("embed") ||
    normalizedType.includes("iframe") ||
    normalizedType.includes("widget") ||
    BLOCK_SAFETY_POLICY.deniedEmbedBlockTypes.has(normalizedType) ||
    BLOCK_SAFETY_POLICY.allowedEmbedBlockTypes.has(normalizedType)
  );
}

function isRootRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

function sanitizeUrlValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (isRootRelativePath(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

function hasDangerousHtml(value: string): boolean {
  return /<\s*script\b/i.test(value) || /on[a-z]+\s*=\s*/i.test(value) || /javascript\s*:/i.test(value);
}

function sanitizePropValue(
  key: string,
  value: unknown,
  blockType: string,
  allowedInlineHtmlBlockTypes: ReadonlySet<string>,
): unknown {
  if (typeof value === "string") {
    if (URL_PROP_KEYS.has(key)) {
      return sanitizeUrlValue(value);
    }

    if (HTML_PROP_KEYS.has(key)) {
      const allowInlineHtml = allowedInlineHtmlBlockTypes.has(blockType);
      if (!allowInlineHtml && hasDangerousHtml(value)) {
        return "";
      }
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizePropValue(key, entry, blockType, allowedInlineHtmlBlockTypes))
      .filter((entry) => entry !== null && entry !== undefined);
  }

  if (isRecord(value)) {
    const next: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      const sanitizedNestedValue = sanitizePropValue(
        nestedKey,
        nestedValue,
        blockType,
        allowedInlineHtmlBlockTypes,
      );

      if (sanitizedNestedValue !== null && sanitizedNestedValue !== undefined) {
        next[nestedKey] = sanitizedNestedValue;
      }
    }

    return next;
  }

  return value;
}

function sanitizeBlock(
  block: GeneratedBlock,
  allowedInlineHtmlBlockTypes: ReadonlySet<string>,
): GeneratedBlock | null {
  const blockType = typeof block.type === "string" ? block.type.trim() : "";
  const normalizedType = blockType.toLowerCase();

  if (
    isEmbedLikeType(normalizedType) &&
    !BLOCK_SAFETY_POLICY.allowedEmbedBlockTypes.has(normalizedType)
  ) {
    return null;
  }

  const nextBlock: GeneratedBlock = {
    ...block,
    type: blockType || block.type,
  };

  if (isRecord(block.props)) {
    const nextProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(block.props)) {
      const sanitizedValue = sanitizePropValue(key, value, normalizedType, allowedInlineHtmlBlockTypes);
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        nextProps[key] = sanitizedValue;
      }
    }
    nextBlock.props = nextProps;
  }

  if (isRecord(block.cta)) {
    const sanitizedHref =
      typeof block.cta.href === "string" ? sanitizeUrlValue(block.cta.href) : null;

    nextBlock.cta = {
      ...block.cta,
      href: sanitizedHref ?? "/",
    };
  }

  return nextBlock;
}

export function sanitizeGeneratedPageBlockSafety(
  schema: GeneratedPageSchema,
  options?: SanitizeBlockSafetyOptions,
): GeneratedPageSchema {
  const allowedInlineHtmlBlockTypes = new Set(
    (options?.allowedInlineHtmlBlockTypes ?? []).map((type) => type.trim().toLowerCase()),
  );

  const sourceBlocks = schema.blocks ?? schema.sections;
  const sanitizedBlocks = sourceBlocks
    .map((block) => sanitizeBlock(block, allowedInlineHtmlBlockTypes))
    .filter((block): block is GeneratedBlock => block !== null);

  const allowedBlockIds = new Set(sanitizedBlocks.map((block) => block.id));

  const sanitizeLayoutRegion = (
    entries: NonNullable<GeneratedPageSchema["layout"]>["top"],
  ): NonNullable<GeneratedPageSchema["layout"]>["top"] => {
    const nextEntries: NonNullable<GeneratedPageSchema["layout"]>["top"] = [];

    for (const entry of entries) {
      if (typeof entry === "string") {
        if (allowedBlockIds.has(entry)) {
          nextEntries.push(entry);
        }
        continue;
      }

      const sanitizedEntry = sanitizeBlock(entry, allowedInlineHtmlBlockTypes);
      if (sanitizedEntry) {
        nextEntries.push(sanitizedEntry);
      }
    }

    return nextEntries;
  };

  const nextLayout = schema.layout
    ? {
        top: sanitizeLayoutRegion(schema.layout.top),
        main: sanitizeLayoutRegion(schema.layout.main),
        bottom: sanitizeLayoutRegion(schema.layout.bottom),
      }
    : undefined;

  return {
    ...schema,
    blocks: sanitizedBlocks,
    sections: sanitizedBlocks,
    ...(nextLayout ? { layout: nextLayout } : {}),
  };
}
