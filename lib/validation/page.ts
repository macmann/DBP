export const PAGE_VALIDATION_LIMITS = {
  titleMaxLength: 120,
  slugMaxLength: 80,
  promptMaxLength: 6000,
  maxReferenceLinks: 20,
} as const;

export type PageFieldErrors = {
  title?: string;
  slug?: string;
  prompt?: string;
  referenceLinks?: string;
  referenceLinkRows?: Record<number, string>;
};

export function parseReferenceLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseReferenceLinksFromForm(formData: FormData) {
  return formData.getAll("referenceLinks").map((value) => String(value).trim());
}

export function isValidReferenceUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePageInput(input: {
  title: string;
  slug: string;
  prompt: string;
  referenceLinks: string[];
}): PageFieldErrors {
  const errors: PageFieldErrors = {};

  if (!input.title) {
    errors.title = "Page title is required.";
  } else if (input.title.length > PAGE_VALIDATION_LIMITS.titleMaxLength) {
    errors.title = `Page title must be ${PAGE_VALIDATION_LIMITS.titleMaxLength} characters or fewer.`;
  }

  if (input.slug.length > PAGE_VALIDATION_LIMITS.slugMaxLength) {
    errors.slug = `Slug must be ${PAGE_VALIDATION_LIMITS.slugMaxLength} characters or fewer.`;
  }

  if (input.prompt.length > PAGE_VALIDATION_LIMITS.promptMaxLength) {
    errors.prompt = `Prompt must be ${PAGE_VALIDATION_LIMITS.promptMaxLength} characters or fewer.`;
  }

  if (input.referenceLinks.length > PAGE_VALIDATION_LIMITS.maxReferenceLinks) {
    errors.referenceLinks = `Add at most ${PAGE_VALIDATION_LIMITS.maxReferenceLinks} reference links.`;
  }

  const rowErrors: Record<number, string> = {};
  input.referenceLinks.forEach((link, index) => {
    if (link && !isValidReferenceUrl(link)) {
      rowErrors[index] = "Must be a valid http(s) URL.";
    }
  });

  if (Object.keys(rowErrors).length > 0) {
    errors.referenceLinks = "Fix invalid reference links before saving.";
    errors.referenceLinkRows = rowErrors;
  }

  return errors;
}

export function hasPageFieldErrors(errors: PageFieldErrors) {
  return Object.values(errors).some(Boolean);
}
