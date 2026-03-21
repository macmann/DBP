export const ALLOWED_SECTION_TYPES = [
  "hero",
  "logoStrip",
  "features",
  "imageText",
  "gallery",
  "testimonial",
  "faq",
  "cta",
  "footer",
] as const;

export type AllowedSectionType = (typeof ALLOWED_SECTION_TYPES)[number];

type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationFailure = {
  success: false;
  errors: string[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type GeneratedSection = {
  id: string;
  type: AllowedSectionType;
  heading?: string;
  body?: string;
  items?: Array<Record<string, unknown>>;
  mediaAssetIds?: string[];
  cta?: {
    label: string;
    href: string;
  };
};

export type GeneratedPageSchema = {
  pageTitle: string;
  summary?: string;
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
  sections: GeneratedSection[];
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

function isAllowedSectionType(value: unknown): value is AllowedSectionType {
  return typeof value === "string" && ALLOWED_SECTION_TYPES.includes(value as AllowedSectionType);
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

export function sanitizeGeneratedPageSchema(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const sanitized: Record<string, unknown> = {
    ...payload,
  };

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

  if (Array.isArray(payload.sections)) {
    sanitized.sections = payload.sections.map((section) => {
      if (!isRecord(section)) {
        return section;
      }
      const nextSection: Record<string, unknown> = { ...section };
      if (isRecord(section.cta) && typeof section.cta.href === "string") {
        nextSection.cta = {
          ...section.cta,
          href: normalizeCtaHref(section.cta.href),
        };
      }
      return nextSection;
    });
  }

  return sanitized;
}

export function validateGeneratedPageSchema(
  payload: unknown,
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

  if (!Array.isArray(payload.sections)) {
    errors.push("sections must be an array.");
  }

  if (Array.isArray(payload.sections)) {
    payload.sections.forEach((section, index) => {
      if (!isRecord(section)) {
        errors.push(`sections[${index}] must be an object.`);
        return;
      }

      if (typeof section.id !== "string" || section.id.trim().length === 0) {
        errors.push(`sections[${index}].id must be a non-empty string.`);
      }

      if (!isAllowedSectionType(section.type)) {
        errors.push(`sections[${index}].type must be one of: ${ALLOWED_SECTION_TYPES.join(", ")}.`);
      }

      if (section.mediaAssetIds !== undefined) {
        if (
          !Array.isArray(section.mediaAssetIds) ||
          section.mediaAssetIds.some((id) => typeof id !== "string")
        ) {
          errors.push(`sections[${index}].mediaAssetIds must be an array of strings.`);
        }
      }

      if (section.cta !== undefined) {
        if (!isRecord(section.cta)) {
          errors.push(`sections[${index}].cta must be an object.`);
        } else {
          if (typeof section.cta.label !== "string" || section.cta.label.trim().length === 0) {
            errors.push(`sections[${index}].cta.label must be a non-empty string.`);
          }
          if (typeof section.cta.href !== "string" || section.cta.href.trim().length === 0) {
            errors.push(`sections[${index}].cta.href must be a non-empty string.`);
          } else {
            const href = section.cta.href.trim();
            const isPathHref = href.startsWith("/");
            if (!isPathHref && !isValidUrl(href)) {
              errors.push(
                `sections[${index}].cta.href must be an absolute http(s) URL or root-relative path.`,
              );
            }
          }
        }
      }
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: payload as GeneratedPageSchema,
  };
}
