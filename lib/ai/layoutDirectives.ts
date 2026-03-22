import type { GeneratedPageSchema, GeneratedSection } from "@/lib/ai/schema";

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
  sectionOrder: string[];
  sectionVariants: Partial<Record<string, string>>;
};

function normalizeText(input: string): string {
  return input.toLowerCase();
}

function getKnownTypes(sections: GeneratedSection[]): string[] {
  return Array.from(
    new Set(
      sections
        .map((section) => (typeof section.type === "string" ? normalizeText(section.type.trim()) : ""))
        .filter((type) => type.length > 0),
    ),
  );
}

function parseSectionOrder(text: string, knownTypes: string[]): string[] {
  const lines = text.split(/\r?\n/);
  const ordered: string[] = [];

  for (const line of lines) {
    const normalizedLine = normalizeText(line);
    if (!/^(\s*[-*]\s+|\s*\d+[\.\)]\s+)/.test(normalizedLine)) {
      continue;
    }

    for (const sectionType of knownTypes) {
      if (normalizedLine.includes(sectionType) && !ordered.includes(sectionType)) {
        ordered.push(sectionType);
      }
    }
  }

  return ordered;
}

function parseSectionVariants(
  text: string,
  knownTypes: string[],
): Partial<Record<string, string>> {
  const lines = text.split(/\r?\n/);
  const directives: Partial<Record<string, string>> = {};

  for (const line of lines) {
    const normalizedLine = normalizeText(line);

    for (const sectionType of knownTypes) {
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

export function parseLayoutDirectivesFromPrompt(
  prompt: string,
  knownTypes: string[],
): ParsedLayoutDirectives {
  const normalizedPrompt = normalizeText(prompt || "");
  return {
    sectionOrder: parseSectionOrder(normalizedPrompt, knownTypes),
    sectionVariants: parseSectionVariants(normalizedPrompt, knownTypes),
  };
}

function reorderSections(sections: GeneratedSection[], sectionOrder: string[]): GeneratedSection[] {
  if (sectionOrder.length === 0) {
    return sections;
  }

  const rank = new Map(sectionOrder.map((type, index) => [type, index]));
  return [...sections].sort((a, b) => {
    const aType = normalizeText(a.type);
    const bType = normalizeText(b.type);
    const aRank = rank.get(aType);
    const bRank = rank.get(bType);
    if (aRank === undefined && bRank === undefined) return 0;
    if (aRank === undefined) return 1;
    if (bRank === undefined) return -1;
    return aRank - bRank;
  });
}

function applyVariants(
  sections: GeneratedSection[],
  sectionVariants: Partial<Record<string, string>>,
): GeneratedSection[] {
  return sections.map((section) => {
    const blockType = normalizeText(section.type);
    const variant = sectionVariants[blockType];
    if (!variant) {
      return section;
    }

    return {
      ...section,
      variant,
    };
  });
}

export function applyPromptLayoutDirectives(
  schema: GeneratedPageSchema,
  prompt: string,
): GeneratedPageSchema {
  const sourceBlocks = schema.blocks ?? schema.sections ?? [];
  const directives = parseLayoutDirectivesFromPrompt(prompt, getKnownTypes(sourceBlocks));
  const reordered = reorderSections(sourceBlocks, directives.sectionOrder);
  const withVariants = applyVariants(reordered, directives.sectionVariants);

  return {
    ...schema,
    blocks: withVariants,
    sections: withVariants,
  };
}
