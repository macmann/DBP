import type { AllowedSectionType, GeneratedPageSchema, GeneratedSection } from "@/lib/ai/schema";
import { ALLOWED_SECTION_TYPES } from "@/lib/ai/schema";

const KNOWN_VARIANTS = [
  "split",
  "centered",
  "stacked",
  "media-left",
  "media-right",
  "cards-2",
  "cards-3",
  "cards-4",
  "alternating",
] as const;

type ParsedLayoutDirectives = {
  sectionOrder: AllowedSectionType[];
  sectionVariants: Partial<Record<AllowedSectionType, string>>;
};

function normalizeText(input: string): string {
  return input.toLowerCase();
}

function parseSectionOrder(text: string): AllowedSectionType[] {
  const lines = text.split(/\r?\n/);
  const ordered: AllowedSectionType[] = [];

  for (const line of lines) {
    const normalizedLine = normalizeText(line);
    if (!/^(\s*[-*]\s+|\s*\d+[\.\)]\s+)/.test(normalizedLine)) {
      continue;
    }

    for (const sectionType of ALLOWED_SECTION_TYPES) {
      if (normalizedLine.includes(sectionType) && !ordered.includes(sectionType)) {
        ordered.push(sectionType);
      }
    }
  }

  return ordered;
}

function parseSectionVariants(text: string): Partial<Record<AllowedSectionType, string>> {
  const lines = text.split(/\r?\n/);
  const directives: Partial<Record<AllowedSectionType, string>> = {};

  for (const line of lines) {
    const normalizedLine = normalizeText(line);

    for (const sectionType of ALLOWED_SECTION_TYPES) {
      if (!normalizedLine.includes(sectionType)) {
        continue;
      }

      for (const variant of KNOWN_VARIANTS) {
        if (normalizedLine.includes(variant)) {
          directives[sectionType] = variant;
          break;
        }
      }
    }
  }

  return directives;
}

export function parseLayoutDirectivesFromPrompt(prompt: string): ParsedLayoutDirectives {
  const normalizedPrompt = normalizeText(prompt || "");
  return {
    sectionOrder: parseSectionOrder(normalizedPrompt),
    sectionVariants: parseSectionVariants(normalizedPrompt),
  };
}

function reorderSections(sections: GeneratedSection[], sectionOrder: AllowedSectionType[]): GeneratedSection[] {
  if (sectionOrder.length === 0) {
    return sections;
  }

  const rank = new Map(sectionOrder.map((type, index) => [type, index]));
  return [...sections].sort((a, b) => {
    const aRank = rank.get(a.type);
    const bRank = rank.get(b.type);
    if (aRank === undefined && bRank === undefined) return 0;
    if (aRank === undefined) return 1;
    if (bRank === undefined) return -1;
    return aRank - bRank;
  });
}

function applyVariants(
  sections: GeneratedSection[],
  sectionVariants: Partial<Record<AllowedSectionType, string>>,
): GeneratedSection[] {
  return sections.map((section) => {
    const layoutVariant = sectionVariants[section.type];
    if (!layoutVariant) {
      return section;
    }

    return {
      ...section,
      layoutVariant,
    };
  });
}

export function applyPromptLayoutDirectives(
  schema: GeneratedPageSchema,
  prompt: string,
): GeneratedPageSchema {
  const directives = parseLayoutDirectivesFromPrompt(prompt);
  const reordered = reorderSections(schema.sections, directives.sectionOrder);
  const withVariants = applyVariants(reordered, directives.sectionVariants);

  return {
    ...schema,
    sections: withVariants,
  };
}
