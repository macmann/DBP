import type { GeneratedBlock, GeneratedPageSchema } from "@/lib/ai/schema";

const URL_PROP_KEYS = new Set([
  "href",
  "src",
  "url",
  "link",
  "poster",
  "action",
  "formaction",
]);

const ROOT_RELATIVE_ONLY_URL_PROP_KEYS = new Set(["action", "formaction"]);

const HTML_PROP_KEYS = new Set([
  "html",
  "embedhtml",
  "innerhtml",
  "markup",
  "script",
  "code",
  "snippet",
  "srcdoc",
  "iframe",
  "payload",
]);

const ALLOWED_EMBED_BLOCK_TYPES = new Set(["widgetembed"]);
const DENIED_EMBED_BLOCK_TYPES = new Set([
  "embed",
  "iframe",
  "scriptembed",
  "htmlembed",
  "rawhtml",
]);

const EVENT_HANDLER_PROP_PATTERN = /^on[a-z]+$/i;

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

export type BlockSafetyViolationCode =
  | "denied_embed_block"
  | "disallowed_url_protocol"
  | "unsafe_html_payload"
  | "unsafe_event_handler";

const BLOCKING_VIOLATION_CODES = new Set<BlockSafetyViolationCode>([
  "denied_embed_block",
  "unsafe_html_payload",
  "unsafe_event_handler",
]);

export type BlockSafetyViolation = {
  code: BlockSafetyViolationCode;
  blockId: string;
  blockType: string;
  path: string;
  message: string;
  valuePreview?: string;
};

export type BlockSafetyResult = {
  schema: GeneratedPageSchema;
  violations: BlockSafetyViolation[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase();
}

function isEmbedLikeType(type: string): boolean {
  const normalizedType = normalizeType(type);
  return (
    normalizedType.includes("embed") ||
    normalizedType.includes("iframe") ||
    BLOCK_SAFETY_POLICY.deniedEmbedBlockTypes.has(normalizedType) ||
    BLOCK_SAFETY_POLICY.allowedEmbedBlockTypes.has(normalizedType)
  );
}

function isRootRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

function sanitizeUrlValue(value: string, requireRootRelative = false): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (requireRootRelative) {
    return isRootRelativePath(trimmed) ? trimmed : null;
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
  return (
    /<\s*script\b/i.test(value) ||
    /<\s*(iframe|object|embed|link|meta|base)\b/i.test(value) ||
    /on[a-z]+\s*=\s*/i.test(value) ||
    /javascript\s*:/i.test(value)
  );
}

function looksLikeHtml(value: string): boolean {
  return /<[^>]+>/.test(value) || /&lt;[^&]+&gt;/.test(value);
}

function previewValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
}

type BlockContext = {
  blockId: string;
  blockType: string;
};

function pushViolation(
  violations: BlockSafetyViolation[],
  input: Omit<BlockSafetyViolation, "valuePreview"> & { value?: unknown },
) {
  violations.push({
    code: input.code,
    blockId: input.blockId,
    blockType: input.blockType,
    path: input.path,
    message: input.message,
    valuePreview: previewValue(input.value),
  });
}

function sanitizePropValue(
  key: string,
  value: unknown,
  blockType: string,
  allowedInlineHtmlBlockTypes: ReadonlySet<string>,
  blockContext: BlockContext,
  violations: BlockSafetyViolation[],
  path: string,
): unknown {
  const normalizedKey = key.trim().toLowerCase();

  if (EVENT_HANDLER_PROP_PATTERN.test(normalizedKey)) {
    pushViolation(violations, {
      code: "unsafe_event_handler",
      blockId: blockContext.blockId,
      blockType: blockContext.blockType,
      path,
      value,
      message: `Removed event-handler property '${key}' from generated payload.`,
    });
    return null;
  }

  if (typeof value === "string") {
    if (URL_PROP_KEYS.has(normalizedKey)) {
      const sanitizedUrl = sanitizeUrlValue(value, ROOT_RELATIVE_ONLY_URL_PROP_KEYS.has(normalizedKey));
      if (sanitizedUrl === null) {
        pushViolation(violations, {
          code: "disallowed_url_protocol",
          blockId: blockContext.blockId,
          blockType: blockContext.blockType,
          path,
          value,
          message: `Removed URL from '${key}' because only https/http (or root-relative for form actions) is allowed.`,
        });
      }
      return sanitizedUrl;
    }

    if (HTML_PROP_KEYS.has(normalizedKey) || (isEmbedLikeType(blockType) && looksLikeHtml(value))) {
      const allowInlineHtml = allowedInlineHtmlBlockTypes.has(blockType);
      if (!allowInlineHtml || hasDangerousHtml(value)) {
        pushViolation(violations, {
          code: "unsafe_html_payload",
          blockId: blockContext.blockId,
          blockType: blockContext.blockType,
          path,
          value,
          message: hasDangerousHtml(value)
            ? `Removed unsafe HTML/script payload from '${key}'.`
            : `Removed inline HTML payload from '${key}' because this block type does not allow raw HTML.`,
        });
        return "";
      }
    }

    if (
      (normalizedKey.includes("url") || normalizedKey.endsWith("href") || normalizedKey.endsWith("src")) &&
      /^(?:javascript|data|vbscript)\s*:/i.test(value.trim())
    ) {
      pushViolation(violations, {
        code: "disallowed_url_protocol",
        blockId: blockContext.blockId,
        blockType: blockContext.blockType,
        path,
        value,
        message: `Removed URL-like payload from '${key}' because its protocol is unsafe.`,
      });
      return null;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) =>
        sanitizePropValue(
          key,
          entry,
          blockType,
          allowedInlineHtmlBlockTypes,
          blockContext,
          violations,
          `${path}[${index}]`,
        ),
      )
      .filter((entry) => entry !== null && entry !== undefined);
  }

  if (isRecord(value)) {
    const next: Record<string, unknown> = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      const nestedPath = `${path}.${nestedKey}`;
      const sanitizedNestedValue = sanitizePropValue(
        nestedKey,
        nestedValue,
        blockType,
        allowedInlineHtmlBlockTypes,
        blockContext,
        violations,
        nestedPath,
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
  violations: BlockSafetyViolation[],
): GeneratedBlock | null {
  const blockType = typeof block.type === "string" ? block.type.trim() : "";
  const normalizedType = normalizeType(blockType);
  const blockId = typeof block.id === "string" ? block.id : "unknown-block";

  if (isEmbedLikeType(normalizedType) && !BLOCK_SAFETY_POLICY.allowedEmbedBlockTypes.has(normalizedType)) {
    pushViolation(violations, {
      code: "denied_embed_block",
      blockId,
      blockType: blockType || String(block.type),
      path: `blocks.${blockId}`,
      message: `Removed disallowed embed-like block type '${blockType || String(block.type)}'.`,
    });
    return null;
  }

  const nextBlock: GeneratedBlock = {
    ...block,
    type: blockType || block.type,
  };

  if (isRecord(block.props)) {
    const nextProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(block.props)) {
      const sanitizedValue = sanitizePropValue(
        key,
        value,
        normalizedType,
        allowedInlineHtmlBlockTypes,
        {
          blockId,
          blockType: blockType || String(block.type),
        },
        violations,
        `blocks.${blockId}.props.${key}`,
      );
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        nextProps[key] = sanitizedValue;
      }
    }
    nextBlock.props = nextProps;
  }

  if (isRecord(block.cta)) {
    const sanitizedHref = typeof block.cta.href === "string" ? sanitizeUrlValue(block.cta.href) : null;

    if (sanitizedHref === null && typeof block.cta.href === "string") {
      pushViolation(violations, {
        code: "disallowed_url_protocol",
        blockId,
        blockType: blockType || String(block.type),
        path: `blocks.${blockId}.cta.href`,
        value: block.cta.href,
        message: "Replaced unsafe CTA href with '/'.",
      });
    }

    nextBlock.cta = {
      ...block.cta,
      href: sanitizedHref ?? "/",
    };
  }

  return nextBlock;
}

export function inspectGeneratedPageBlockSafety(
  schema: GeneratedPageSchema,
  options?: SanitizeBlockSafetyOptions,
): BlockSafetyResult {
  const allowedInlineHtmlBlockTypes = new Set(
    (options?.allowedInlineHtmlBlockTypes ?? [...BLOCK_SAFETY_POLICY.allowedEmbedBlockTypes]).map((type) =>
      normalizeType(type),
    ),
  );
  const violations: BlockSafetyViolation[] = [];

  const sourceBlocks = schema.blocks ?? schema.sections;
  const sanitizedBlocks = sourceBlocks
    .map((block) => sanitizeBlock(block, allowedInlineHtmlBlockTypes, violations))
    .filter((block): block is GeneratedBlock => block !== null);

  const allowedBlockIds = new Set(sanitizedBlocks.map((block) => block.id));

  const sanitizeLayoutRegion = (
    entries: NonNullable<GeneratedPageSchema["layout"]>["top"],
  ): NonNullable<GeneratedPageSchema["layout"]>["top"] => {
    const nextEntries: NonNullable<GeneratedPageSchema["layout"]>["top"] = [];

    for (const entry of entries) {
      if (allowedBlockIds.has(entry)) {
        nextEntries.push(entry);
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
    schema: {
      ...schema,
      blocks: sanitizedBlocks,
      sections: sanitizedBlocks,
      ...(nextLayout ? { layout: nextLayout } : {}),
    },
    violations,
  };
}

export function sanitizeGeneratedPageBlockSafety(
  schema: GeneratedPageSchema,
  options?: SanitizeBlockSafetyOptions,
): GeneratedPageSchema {
  return inspectGeneratedPageBlockSafety(schema, options).schema;
}

export function formatBlockSafetyViolations(violations: readonly BlockSafetyViolation[]): string {
  if (violations.length === 0) {
    return "";
  }

  return violations
    .slice(0, 5)
    .map((violation, index) => {
      const valueSnippet = violation.valuePreview ? ` Value: ${violation.valuePreview}` : "";
      let remediation = "Remove unsafe payload patterns from prompt/reference inputs.";
      if (violation.code === "disallowed_url_protocol") {
        remediation = "Use only https/http URLs (or root-relative paths for form actions).";
      } else if (violation.code === "denied_embed_block") {
        remediation = "Use an allowlisted block type such as 'widgetEmbed'.";
      } else if (violation.code === "unsafe_event_handler") {
        remediation = "Remove inline event handlers like onClick/onLoad and use structured props only.";
      }
      return `${index + 1}. [${violation.code}] ${violation.message} (${violation.path}). ${remediation}${valueSnippet}`;
    })
    .join(" ");
}

export function getBlockingBlockSafetyViolations(
  violations: readonly BlockSafetyViolation[],
): BlockSafetyViolation[] {
  return violations.filter((violation) => BLOCKING_VIOLATION_CODES.has(violation.code));
}

export function hasBlockingBlockSafetyViolations(
  violations: readonly BlockSafetyViolation[],
): boolean {
  return getBlockingBlockSafetyViolations(violations).length > 0;
}
