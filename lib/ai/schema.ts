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
export type GeneratedPageLayout = {
  top: string[];
  main: string[];
  bottom: string[];
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
  const {
    layoutVariant,
    heading,
    body,
    items,
    mediaAssetIds,
    cta,
    props,
    ...rest
  } = section;

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

function getRawBlocks(payload: Record<string, unknown>): unknown {
  return payload.blocks ?? payload.sections;
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

function getBlockCta(block: Record<string, unknown>): unknown {
  if (isRecord(block.props) && block.props.cta !== undefined) {
    return block.props.cta;
  }

  return block.cta;
}

function sanitizeBlockRecord(block: Record<string, unknown>): Record<string, unknown> {
  const nextBlock = { ...block };

  if (typeof nextBlock.variant === "string") {
    nextBlock.variant = nextBlock.variant.trim();
  }

  if (isRecord(nextBlock.props) && isRecord(nextBlock.props.cta) && typeof nextBlock.props.cta.href === "string") {
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

  const sanitized: Record<string, unknown> = {
    ...payload,
    schemaVersion: CURRENT_GENERATED_SCHEMA_VERSION,
  };

  if (typeof payload.pageHeaderAlignment === "string") {
    const normalizedAlignment = payload.pageHeaderAlignment.trim().toLowerCase();
    if (normalizedAlignment === "left" || normalizedAlignment === "center") {
      sanitized.pageHeaderAlignment = normalizedAlignment;
    }
  }

  if (isRecord(payload.seo)) {
    const seo = { ...payload.seo };
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

  const rawBlocks = getRawBlocks(payload);
  let normalizedBlockRecords: Record<string, unknown>[] = [];
  if (Array.isArray(rawBlocks)) {
    const normalizedBlocks = rawBlocks.map((block) => {
      if (!isRecord(block)) {
        return block;
      }

      const nextBlock = Array.isArray(payload.blocks) ? { ...block } : coerceLegacySectionToBlock(block);
      return sanitizeBlockRecord(nextBlock);
    });

    sanitized.blocks = normalizedBlocks;
    if ("sections" in sanitized) {
      delete sanitized.sections;
    }
    normalizedBlockRecords = normalizedBlocks.filter((block): block is Record<string, unknown> => isRecord(block));

    if (!isRecord(payload.layout)) {
      sanitized.layout = inferDefaultLayout(normalizedBlockRecords);
    }
  }

  if (isRecord(payload.layout)) {
    const regionNames = ["top", "main", "bottom"] as const;
    const nextLayout: Record<string, unknown> = {};

    for (const regionName of regionNames) {
      const rawEntries = payload.layout[regionName];
      if (!Array.isArray(rawEntries)) {
        continue;
      }

      nextLayout[regionName] = rawEntries
        .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }

        if (isRecord(entry) && typeof entry.id === "string") {
          return entry.id.trim();
        }

        return "";
      })
        .filter((entry) => entry.length > 0);
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

  if (typeof payload.pageTitle !== "string" || payload.pageTitle.trim().length === 0) {
    errors.push("pageTitle must be a non-empty string.");
  }

  if (payload.schemaVersion !== undefined) {
    if (
      typeof payload.schemaVersion !== "number" ||
      !Number.isInteger(payload.schemaVersion) ||
      payload.schemaVersion < 1
    ) {
      errors.push("schemaVersion must be a positive integer when provided.");
    }
  }

  if (payload.pageHeaderAlignment !== undefined) {
    if (
      typeof payload.pageHeaderAlignment !== "string" ||
      !["left", "center"].includes(payload.pageHeaderAlignment.trim().toLowerCase())
    ) {
      errors.push("pageHeaderAlignment must be either 'left' or 'center' when provided.");
    }
  }

  if (!isRecord(payload.theme)) {
    errors.push("theme must be an object.");
  } else {
    if (
      !hasOnlyAllowedKeys(payload.theme, [
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
      typeof payload.theme.primaryColor !== "string" ||
      payload.theme.primaryColor.trim().length === 0
    ) {
      errors.push("theme.primaryColor must be a non-empty string.");
    }

    if (
      typeof payload.theme.accentColor !== "string" ||
      payload.theme.accentColor.trim().length === 0
    ) {
      errors.push("theme.accentColor must be a non-empty string.");
    }

    if (
      typeof payload.theme.fontFamily !== "string" ||
      payload.theme.fontFamily.trim().length === 0
    ) {
      errors.push("theme.fontFamily must be a non-empty string.");
    }

    if (payload.theme.spacing !== undefined) {
      if (typeof payload.theme.spacing !== "string" || payload.theme.spacing.trim().length === 0) {
        errors.push("theme.spacing must be a non-empty string when provided.");
      }
    }

    if (payload.theme.radius !== undefined) {
      if (typeof payload.theme.radius !== "string" || payload.theme.radius.trim().length === 0) {
        errors.push("theme.radius must be a non-empty string when provided.");
      }
    }
  }

  if (!isRecord(payload.seo)) {
    errors.push("seo must be an object.");
  } else {
    if (
      !hasOnlyAllowedKeys(payload.seo, ["title", "description", "canonicalUrl", "ogImageAssetId"])
    ) {
      errors.push("seo contains unsupported keys.");
    }

    if (typeof payload.seo.title !== "string" || payload.seo.title.trim().length === 0) {
      errors.push("seo.title must be a non-empty string.");
    } else if (payload.seo.title.length > 70) {
      errors.push("seo.title must be at most 70 characters.");
    }

    if (
      typeof payload.seo.description !== "string" ||
      payload.seo.description.trim().length === 0
    ) {
      errors.push("seo.description must be a non-empty string.");
    } else if (payload.seo.description.length > 160) {
      errors.push("seo.description must be at most 160 characters.");
    }

    if (payload.seo.canonicalUrl !== undefined) {
      if (
        typeof payload.seo.canonicalUrl !== "string" ||
        payload.seo.canonicalUrl.trim().length === 0
      ) {
        errors.push("seo.canonicalUrl must be a non-empty string when provided.");
      } else if (!isValidUrl(payload.seo.canonicalUrl)) {
        errors.push("seo.canonicalUrl must be a valid http(s) URL.");
      }
    }

    if (
      payload.seo.ogImageAssetId !== undefined &&
      (typeof payload.seo.ogImageAssetId !== "string" ||
        payload.seo.ogImageAssetId.trim().length === 0)
    ) {
      errors.push("seo.ogImageAssetId must be a non-empty string when provided.");
    }
  }

  const rawBlocks = getRawBlocks(payload);

  if (!Array.isArray(rawBlocks)) {
    errors.push("blocks must be an array.");
  }

  if (Array.isArray(rawBlocks)) {
    rawBlocks.forEach((maybeBlock, index) => {
      if (!isRecord(maybeBlock)) {
        errors.push(`blocks[${index}] must be an object.`);
        return;
      }

      const block = payload.blocks ? maybeBlock : coerceLegacySectionToBlock(maybeBlock);

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

      if (block.variant !== undefined && (typeof block.variant !== "string" || block.variant.trim().length === 0)) {
        errors.push(`blocks[${index}].variant must be a non-empty string when provided.`);
      } else if (typeof block.variant === "string" && !isUrlSafeToken(block.variant.trim())) {
        errors.push(`blocks[${index}].variant must be URL-safe (letters, numbers, '-' or '_').`);
      }

      if (block.props !== undefined && !isRecord(block.props)) {
        errors.push(`blocks[${index}].props must be an object when provided.`);
      }

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

  if (payload.layout !== undefined) {
    const regionNames = ["top", "main", "bottom"] as const;
    if (!isRecord(payload.layout)) {
      errors.push("layout must be an object when provided.");
    } else {
      if (!hasOnlyAllowedKeys(payload.layout, [...regionNames])) {
        errors.push("layout contains unsupported keys.");
      }

      for (const regionName of regionNames) {
        const regionEntries = payload.layout[regionName];
        if (!Array.isArray(regionEntries)) {
          errors.push(`layout.${regionName} must be an array.`);
          continue;
        }

        regionEntries.forEach((entry, index) => {
          if (typeof entry !== "string" || entry.trim().length === 0) {
            errors.push(`layout.${regionName}[${index}] must be a non-empty string reference.`);
            return;
          }

          if (!isUrlSafeToken(entry.trim())) {
            errors.push(
              `layout.${regionName}[${index}] must be URL-safe (letters, numbers, '-' or '_').`,
            );
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
