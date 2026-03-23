type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationFailure = {
  success: false;
  errors: string[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type GeneratedBlock = {
  id: string;
  type: string;
  variant?: string;
  props?: Record<string, unknown>;
  // Legacy section fields kept for compatibility with existing renderers.
  layoutVariant?: string;
  heading?: string;
  body?: string;
  items?: Array<Record<string, unknown>>;
  mediaAssetIds?: string[];
  cta?: {
    label: string;
    href: string;
  };
};

// Backward-compatible alias for older call sites.
export type GeneratedSection = GeneratedBlock;
export type GeneratedLayoutEntry = string | GeneratedBlock;
export type GeneratedPageLayout = {
  top: GeneratedLayoutEntry[];
  main: GeneratedLayoutEntry[];
  bottom: GeneratedLayoutEntry[];
};

export const CURRENT_GENERATED_SCHEMA_VERSION = 2;

export type GeneratedPageSchema = {
  schemaVersion?: number;
  pageTitle: string;
  summary?: string;
  pageHeaderAlignment?: "left" | "center";
  theme: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    spacing?: string;
    radius?: string;
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl?: string;
    ogImageAssetId?: string;
  };
  blocks: GeneratedBlock[];
  // Legacy alias accepted at ingest time via sanitize/validate, but not emitted.
  sections?: GeneratedBlock[];
  layout?: GeneratedPageLayout;
};

export type BlockValidator = (props: Record<string, unknown> | undefined) => string[];

export type ValidateGeneratedPageSchemaOptions = {
  blockValidators?: Partial<Record<string, BlockValidator>>;
};

function looksLikeDomain(value: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(value);
}

function normalizeCtaHref(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  if (trimmed.startsWith("/") || isValidUrl(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("www.") || looksLikeDomain(trimmed)) {
    return `https://${trimmed}`;
  }

  if (!trimmed.includes(" ") && !trimmed.includes("://")) {
    return `/${trimmed.replace(/^\/+/, "")}`;
  }

  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasOnlyAllowedKeys(record: Record<string, unknown>, allowedKeys: string[]): boolean {
  return Object.keys(record).every((key) => allowedKeys.includes(key));
}

function coerceLegacySectionToBlock(section: Record<string, unknown>): Record<string, unknown> {
  const { layoutVariant, heading, body, items, mediaAssetIds, cta, props, ...rest } = section;

  const nextProps: Record<string, unknown> = {
    ...(isRecord(props) ? props : {}),
  };

  if (heading !== undefined) nextProps.heading = heading;
  if (body !== undefined) nextProps.body = body;
  if (items !== undefined) nextProps.items = items;
  if (mediaAssetIds !== undefined) nextProps.mediaAssetIds = mediaAssetIds;
  if (cta !== undefined) nextProps.cta = cta;

  return {
    ...rest,
    ...(layoutVariant !== undefined ? { variant: layoutVariant } : {}),
    ...(Object.keys(nextProps).length > 0 ? { props: nextProps } : {}),
  };
}

function transformLegacySectionsPayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(payload.blocks) || !Array.isArray(payload.sections)) {
    return payload;
  }

  const transformedBlocks = payload.sections.map((section) => {
    if (!isRecord(section)) {
      return section;
    }
    return coerceLegacySectionToBlock(section);
  });

  const nextPayload: Record<string, unknown> = {
    ...payload,
    blocks: transformedBlocks,
  };
  delete nextPayload.sections;

  return nextPayload;
}

export function migrateLegacySectionsPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  return transformLegacySectionsPayload(payload);
}

function isUrlSafeToken(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/i.test(value);
}

function inferDefaultLayout(blocks: Record<string, unknown>[]): GeneratedPageLayout {
  const contentBlockIds = blocks
    .map((block) => block.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  return {
    top: ["shell-page-header"],
    main: contentBlockIds,
    bottom: ["shell-widget-embed", "shell-build-meta"],
  };
}

function sanitizeLayoutEntry(entry: unknown): GeneratedLayoutEntry | null {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!isRecord(entry) || typeof entry.id !== "string") {
    return null;
  }

  const normalizedId = entry.id.trim();
  if (normalizedId.length === 0) {
    return null;
  }

  if (typeof entry.type === "string") {
    const sanitizedInlineBlock = sanitizeBlockRecord({
      ...entry,
      id: normalizedId,
      type: entry.type.trim(),
    });
    return sanitizedInlineBlock as GeneratedBlock;
  }

  return normalizedId;
}

function getBlockCta(block: Record<string, unknown>): unknown {
  if (isRecord(block.props) && block.props.cta !== undefined) {
    return block.props.cta;
  }

  return block.cta;
}

function validateBlockBaselineShape(block: Record<string, unknown>, index: number): string[] {
  const errors: string[] = [];

  if (typeof block.id !== "string" || block.id.trim().length === 0) {
    errors.push(`blocks[${index}].id must be a non-empty string.`);
  } else if (!isUrlSafeToken(block.id.trim())) {
    errors.push(`blocks[${index}].id must be URL-safe (letters, numbers, '-' or '_').`);
  }

  if (typeof block.type !== "string" || block.type.trim().length === 0) {
    errors.push(`blocks[${index}].type must be a non-empty string.`);
  } else if (!isUrlSafeToken(block.type.trim())) {
    errors.push(`blocks[${index}].type must be URL-safe (letters, numbers, '-' or '_').`);
  }

  if (
    block.variant !== undefined &&
    (typeof block.variant !== "string" || block.variant.trim().length === 0)
  ) {
    errors.push(`blocks[${index}].variant must be a non-empty string when provided.`);
  } else if (typeof block.variant === "string" && !isUrlSafeToken(block.variant.trim())) {
    errors.push(`blocks[${index}].variant must be URL-safe (letters, numbers, '-' or '_').`);
  }

  if (block.props !== undefined && !isRecord(block.props)) {
    errors.push(`blocks[${index}].props must be an object when provided.`);
  }

  return errors;
}

function sanitizeBlockRecord(block: Record<string, unknown>): Record<string, unknown> {
  const nextBlock = { ...block };

  if (typeof nextBlock.variant === "string") {
    nextBlock.variant = nextBlock.variant.trim();
  }

  if (
    isRecord(nextBlock.props) &&
    isRecord(nextBlock.props.cta) &&
    typeof nextBlock.props.cta.href === "string"
  ) {
    nextBlock.props = {
      ...nextBlock.props,
      cta: {
        ...nextBlock.props.cta,
        href: normalizeCtaHref(nextBlock.props.cta.href),
      },
    };
  }

  if (isRecord(nextBlock.cta) && typeof nextBlock.cta.href === "string") {
    nextBlock.cta = {
      ...nextBlock.cta,
      href: normalizeCtaHref(nextBlock.cta.href),
    };
  }

  return nextBlock;
}

export function sanitizeGeneratedPageSchema(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const normalizedPayload = transformLegacySectionsPayload(payload);

  const sanitized: Record<string, unknown> = {
    ...normalizedPayload,
    schemaVersion: CURRENT_GENERATED_SCHEMA_VERSION,
  };

  if (typeof normalizedPayload.pageHeaderAlignment === "string") {
    const normalizedAlignment = normalizedPayload.pageHeaderAlignment.trim().toLowerCase();
    if (normalizedAlignment === "left" || normalizedAlignment === "center") {
      sanitized.pageHeaderAlignment = normalizedAlignment;
    }
  }

  if (isRecord(normalizedPayload.seo)) {
    const seo = { ...normalizedPayload.seo };
    if (typeof seo.title === "string") {
      seo.title = seo.title.trim().slice(0, 70);
    }
    if (typeof seo.description === "string") {
      seo.description = seo.description.trim().slice(0, 160);
    }
    if (typeof seo.canonicalUrl === "string") {
      seo.canonicalUrl = seo.canonicalUrl.trim();
    }
    sanitized.seo = seo;
  }

  let normalizedBlockRecords: Record<string, unknown>[] = [];
  if (Array.isArray(normalizedPayload.blocks)) {
    const normalizedBlocks = normalizedPayload.blocks.map((block) => {
      if (!isRecord(block)) {
        return block;
      }

      const nextBlock = { ...block };
      return sanitizeBlockRecord(nextBlock);
    });

    sanitized.blocks = normalizedBlocks;
    if ("sections" in sanitized) {
      delete sanitized.sections;
    }
    normalizedBlockRecords = normalizedBlocks.filter((block): block is Record<string, unknown> =>
      isRecord(block),
    );

    if (!isRecord(normalizedPayload.layout)) {
      sanitized.layout = inferDefaultLayout(normalizedBlockRecords);
    }
  }

  if (isRecord(normalizedPayload.layout)) {
    const regionNames = ["top", "main", "bottom"] as const;
    const nextLayout: Record<string, unknown> = {};

    for (const regionName of regionNames) {
      const rawEntries = normalizedPayload.layout[regionName];
      if (!Array.isArray(rawEntries)) {
        continue;
      }

      nextLayout[regionName] = rawEntries
        .map((entry) => sanitizeLayoutEntry(entry))
        .filter((entry): entry is GeneratedLayoutEntry => entry !== null);
    }

    sanitized.layout = nextLayout;

    if (normalizedBlockRecords.length > 0 && !Array.isArray(nextLayout.main)) {
      sanitized.layout = {
        ...nextLayout,
        main: inferDefaultLayout(normalizedBlockRecords).main,
      };
    }
  }

  return sanitized;
}

export function validateGeneratedPageSchema(
  payload: unknown,
  options?: ValidateGeneratedPageSchemaOptions,
): ValidationResult<GeneratedPageSchema> {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return {
      success: false,
      errors: ["Output must be a JSON object."],
    };
  }

  const normalizedPayload = transformLegacySectionsPayload(payload);

  if (
    !hasOnlyAllowedKeys(normalizedPayload, [
      "schemaVersion",
      "pageTitle",
      "summary",
      "pageHeaderAlignment",
      "theme",
      "seo",
      "blocks",
      "layout",
    ])
  ) {
    errors.push("Output contains unsupported top-level keys.");
  }

  if (
    typeof normalizedPayload.pageTitle !== "string" ||
    normalizedPayload.pageTitle.trim().length === 0
  ) {
    errors.push("pageTitle must be a non-empty string.");
  }

  if (normalizedPayload.schemaVersion !== undefined) {
    if (
      typeof normalizedPayload.schemaVersion !== "number" ||
      !Number.isInteger(normalizedPayload.schemaVersion) ||
      normalizedPayload.schemaVersion < 1
    ) {
      errors.push("schemaVersion must be a positive integer when provided.");
    }
  }

  if (normalizedPayload.pageHeaderAlignment !== undefined) {
    if (
      typeof normalizedPayload.pageHeaderAlignment !== "string" ||
      !["left", "center"].includes(normalizedPayload.pageHeaderAlignment.trim().toLowerCase())
    ) {
      errors.push("pageHeaderAlignment must be either 'left' or 'center' when provided.");
    }
  }

  if (!isRecord(normalizedPayload.theme)) {
    errors.push("theme must be an object.");
  } else {
    if (
      !hasOnlyAllowedKeys(normalizedPayload.theme, [
        "primaryColor",
        "accentColor",
        "fontFamily",
        "spacing",
        "radius",
      ])
    ) {
      errors.push("theme contains unsupported keys.");
    }

    if (
      typeof normalizedPayload.theme.primaryColor !== "string" ||
      normalizedPayload.theme.primaryColor.trim().length === 0
    ) {
      errors.push("theme.primaryColor must be a non-empty string.");
    }

    if (
      typeof normalizedPayload.theme.accentColor !== "string" ||
      normalizedPayload.theme.accentColor.trim().length === 0
    ) {
      errors.push("theme.accentColor must be a non-empty string.");
    }

    if (
      typeof normalizedPayload.theme.fontFamily !== "string" ||
      normalizedPayload.theme.fontFamily.trim().length === 0
    ) {
      errors.push("theme.fontFamily must be a non-empty string.");
    }

    if (normalizedPayload.theme.spacing !== undefined) {
      if (
        typeof normalizedPayload.theme.spacing !== "string" ||
        normalizedPayload.theme.spacing.trim().length === 0
      ) {
        errors.push("theme.spacing must be a non-empty string when provided.");
      }
    }

    if (normalizedPayload.theme.radius !== undefined) {
      if (
        typeof normalizedPayload.theme.radius !== "string" ||
        normalizedPayload.theme.radius.trim().length === 0
      ) {
        errors.push("theme.radius must be a non-empty string when provided.");
      }
    }
  }

  if (!isRecord(normalizedPayload.seo)) {
    errors.push("seo must be an object.");
  } else {
    if (
      !hasOnlyAllowedKeys(normalizedPayload.seo, [
        "title",
        "description",
        "canonicalUrl",
        "ogImageAssetId",
      ])
    ) {
      errors.push("seo contains unsupported keys.");
    }

    if (
      typeof normalizedPayload.seo.title !== "string" ||
      normalizedPayload.seo.title.trim().length === 0
    ) {
      errors.push("seo.title must be a non-empty string.");
    } else if (normalizedPayload.seo.title.length > 70) {
      errors.push("seo.title must be at most 70 characters.");
    }

    if (
      typeof normalizedPayload.seo.description !== "string" ||
      normalizedPayload.seo.description.trim().length === 0
    ) {
      errors.push("seo.description must be a non-empty string.");
    } else if (normalizedPayload.seo.description.length > 160) {
      errors.push("seo.description must be at most 160 characters.");
    }

    if (normalizedPayload.seo.canonicalUrl !== undefined) {
      if (
        typeof normalizedPayload.seo.canonicalUrl !== "string" ||
        normalizedPayload.seo.canonicalUrl.trim().length === 0
      ) {
        errors.push("seo.canonicalUrl must be a non-empty string when provided.");
      } else if (!isValidUrl(normalizedPayload.seo.canonicalUrl)) {
        errors.push("seo.canonicalUrl must be a valid http(s) URL.");
      }
    }

    if (
      normalizedPayload.seo.ogImageAssetId !== undefined &&
      (typeof normalizedPayload.seo.ogImageAssetId !== "string" ||
        normalizedPayload.seo.ogImageAssetId.trim().length === 0)
    ) {
      errors.push("seo.ogImageAssetId must be a non-empty string when provided.");
    }
  }

  if (!Array.isArray(normalizedPayload.blocks)) {
    errors.push("blocks must be an array.");
  }

  if (Array.isArray(normalizedPayload.blocks)) {
    normalizedPayload.blocks.forEach((maybeBlock, index) => {
      if (!isRecord(maybeBlock)) {
        errors.push(`blocks[${index}] must be an object.`);
        return;
      }

      const block = maybeBlock;
      errors.push(...validateBlockBaselineShape(block, index));

      const cta = getBlockCta(block);
      if (cta !== undefined) {
        if (!isRecord(cta)) {
          errors.push(`blocks[${index}].cta must be an object.`);
        } else {
          if (typeof cta.label !== "string" || cta.label.trim().length === 0) {
            errors.push(`blocks[${index}].cta.label must be a non-empty string.`);
          }

          if (typeof cta.href !== "string" || cta.href.trim().length === 0) {
            errors.push(`blocks[${index}].cta.href must be a non-empty string.`);
          } else {
            const href = cta.href.trim();
            const isPathHref = href.startsWith("/");
            if (!isPathHref && !isValidUrl(href)) {
              errors.push(
                `blocks[${index}].cta.href must be an absolute http(s) URL or root-relative path.`,
              );
            }
          }
        }
      }

      if (typeof block.type === "string") {
        const validator = options?.blockValidators?.[block.type];
        if (validator) {
          const blockValidatorErrors = validator(isRecord(block.props) ? block.props : undefined);
          for (const error of blockValidatorErrors) {
            errors.push(`blocks[${index}].${error}`);
          }
        }
      }
    });
  }

  if (normalizedPayload.layout !== undefined) {
    const regionNames = ["top", "main", "bottom"] as const;
    if (!isRecord(normalizedPayload.layout)) {
      errors.push("layout must be an object when provided.");
    } else {
      if (!hasOnlyAllowedKeys(normalizedPayload.layout, [...regionNames])) {
        errors.push("layout contains unsupported keys.");
      }

      for (const regionName of regionNames) {
        const regionEntries = normalizedPayload.layout[regionName];
        if (!Array.isArray(regionEntries)) {
          errors.push(`layout.${regionName} must be an array.`);
          continue;
        }

        regionEntries.forEach((entry, index) => {
          if (typeof entry === "string") {
            if (entry.trim().length === 0) {
              errors.push(`layout.${regionName}[${index}] must be a non-empty string reference.`);
              return;
            }

            if (!isUrlSafeToken(entry.trim())) {
              errors.push(
                `layout.${regionName}[${index}] must be URL-safe (letters, numbers, '-' or '_').`,
              );
            }
            return;
          }

          if (!isRecord(entry)) {
            errors.push(
              `layout.${regionName}[${index}] must be a string block ID or inline block object.`,
            );
            return;
          }

          const inlineEntry = entry;
          if (typeof inlineEntry.id !== "string" || inlineEntry.id.trim().length === 0) {
            errors.push(`layout.${regionName}[${index}].id must be a non-empty string.`);
          } else if (!isUrlSafeToken(inlineEntry.id.trim())) {
            errors.push(
              `layout.${regionName}[${index}].id must be URL-safe (letters, numbers, '-' or '_').`,
            );
          }

          if (typeof inlineEntry.type !== "string" || inlineEntry.type.trim().length === 0) {
            errors.push(`layout.${regionName}[${index}].type must be a non-empty string.`);
          } else if (!isUrlSafeToken(inlineEntry.type.trim())) {
            errors.push(
              `layout.${regionName}[${index}].type must be URL-safe (letters, numbers, '-' or '_').`,
            );
          }

          if (
            inlineEntry.variant !== undefined &&
            (typeof inlineEntry.variant !== "string" || inlineEntry.variant.trim().length === 0)
          ) {
            errors.push(
              `layout.${regionName}[${index}].variant must be a non-empty string when provided.`,
            );
          } else if (
            typeof inlineEntry.variant === "string" &&
            !isUrlSafeToken(inlineEntry.variant.trim())
          ) {
            errors.push(
              `layout.${regionName}[${index}].variant must be URL-safe (letters, numbers, '-' or '_').`,
            );
          }

          if (inlineEntry.props !== undefined && !isRecord(inlineEntry.props)) {
            errors.push(`layout.${regionName}[${index}].props must be an object when provided.`);
          }
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  const sanitized = sanitizeGeneratedPageSchema(payload);

  return {
    success: true,
    data: sanitized as GeneratedPageSchema,
  };
}
