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
  sections: GeneratedSection[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAllowedSectionType(value: unknown): value is AllowedSectionType {
  return typeof value === "string" && ALLOWED_SECTION_TYPES.includes(value as AllowedSectionType);
}

export function validateGeneratedPageSchema(payload: unknown): ValidationResult<GeneratedPageSchema> {
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
        errors.push(
          `sections[${index}].type must be one of: ${ALLOWED_SECTION_TYPES.join(", ")}.`,
        );
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
