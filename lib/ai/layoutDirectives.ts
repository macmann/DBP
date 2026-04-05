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

type AliasToTypeMap = Map<string, string>;

function normalizeText(input: string): string {
  return input.toLowerCase();
}

function canonicalizeAlias(input: string): string {
  return normalizeText(input).replace(/[^a-z0-9]+/g, "");
}

function splitCamelCase(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function getTypeAliases(type: string): string[] {
  const trimmedType = type.trim();
  if (!trimmedType) {
    return [];
  }

  const normalizedType = normalizeText(trimmedType);
  const spacedType = normalizeText(splitCamelCase(trimmedType));
  const hyphenType = normalizedType.replace(/[_\s]+/g, "-");
  const spaceType = normalizedType.replace(/[-_]+/g, " ");
  const aliases = new Set([normalizedType, spacedType, hyphenType, spaceType, canonicalizeAlias(trimmedType)]);

  if (normalizedType === "logostrip") {
    aliases.add("logo strip");
    aliases.add("logo wall");
    aliases.add("logo bar");
  }
  if (normalizedType === "imagetext") {
    aliases.add("image text");
    aliases.add("text image");
    aliases.add("media text");
  }
  if (normalizedType === "testimonial") {
    aliases.add("testimonials");
  }
  if (normalizedType === "features") {
    aliases.add("feature");
    aliases.add("feature grid");
    aliases.add("features grid");
  }
  if (normalizedType === "faq") {
    aliases.add("faqs");
    aliases.add("questions");
  }
  if (normalizedType === "cta") {
    aliases.add("call to action");
    aliases.add("call-to-action");
  }

  return Array.from(aliases).filter((alias) => alias.trim().length > 0);
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

function buildAliasMap(knownTypes: string[]): AliasToTypeMap {
  const map: AliasToTypeMap = new Map();
  for (const knownType of knownTypes) {
    for (const alias of getTypeAliases(knownType)) {
      map.set(alias, knownType);
    }
  }
  return map;
}

function getTypesMentionedInLine(line: string, aliasMap: AliasToTypeMap): string[] {
  const normalizedLine = normalizeText(line);
  const canonicalLine = canonicalizeAlias(line);
  const matched: string[] = [];

  for (const [alias, sectionType] of aliasMap.entries()) {
    const isCanonicalAlias = alias === canonicalizeAlias(alias);
    const isMentioned = isCanonicalAlias
      ? canonicalLine.includes(alias)
      : normalizedLine.includes(alias);
    if (isMentioned && !matched.includes(sectionType)) {
      matched.push(sectionType);
    }
  }

  return matched;
}

function parseSectionOrderFromBullets(text: string, aliasMap: AliasToTypeMap): string[] {
  const lines = text.split(/\r?\n/);
  const ordered: string[] = [];

  for (const line of lines) {
    const normalizedLine = normalizeText(line);
    if (!/^(\s*[-*]\s+|\s*\d+[\.\)]\s+)/.test(normalizedLine)) {
      continue;
    }

    for (const sectionType of getTypesMentionedInLine(line, aliasMap)) {
      if (!ordered.includes(sectionType)) {
        ordered.push(sectionType);
      }
    }
  }

  return ordered;
}

function parseSectionOrderFromMentionPosition(
  text: string,
  knownTypes: string[],
): string[] {
  const mentionIndexByType = new Map<string, number>();
  const lowered = normalizeText(text);
  const canonicalPrompt = canonicalizeAlias(text);

  for (const knownType of knownTypes) {
    let earliestMentionIndex = Number.POSITIVE_INFINITY;
    for (const alias of getTypeAliases(knownType)) {
      const searchBase = alias === canonicalizeAlias(alias) ? canonicalPrompt : lowered;
      const target = alias === canonicalizeAlias(alias) ? alias : normalizeText(alias);
      const index = searchBase.indexOf(target);
      if (index !== -1 && index < earliestMentionIndex) {
        earliestMentionIndex = index;
      }
    }
    if (Number.isFinite(earliestMentionIndex)) {
      mentionIndexByType.set(knownType, earliestMentionIndex);
    }
  }

  if (mentionIndexByType.size < 2) {
    return [];
  }

  return knownTypes
    .filter((type) => mentionIndexByType.has(type))
    .sort((a, b) => (mentionIndexByType.get(a) ?? 0) - (mentionIndexByType.get(b) ?? 0));
}

function parseSectionOrder(text: string, knownTypes: string[], aliasMap: AliasToTypeMap): string[] {
  const orderedFromBullets = parseSectionOrderFromBullets(text, aliasMap);
  if (orderedFromBullets.length > 0) {
    return orderedFromBullets;
  }

  return parseSectionOrderFromMentionPosition(text, knownTypes);
}

const VARIANT_SYNONYMS: Record<string, string[]> = {
  split: ["split"],
  centered: ["centered", "center aligned", "centre aligned", "center hero"],
  stacked: ["stacked", "single column"],
  "media-left": ["media-left", "image left", "visual left", "left image", "left media"],
  "media-right": ["media-right", "image right", "visual right", "right image", "right media"],
  "cards-2": ["cards-2", "2 cards", "two cards", "two-column cards"],
  "cards-3": ["cards-3", "3 cards", "three cards", "three-column cards"],
  "cards-4": ["cards-4", "4 cards", "four cards", "four-column cards"],
  alternating: ["alternating", "zigzag"],
};

function parseSectionVariants(
  text: string,
  aliasMap: AliasToTypeMap,
): Partial<Record<string, string>> {
  const lines = text.split(/\r?\n/);
  const directives: Partial<Record<string, string>> = {};

  for (const line of lines) {
    const normalizedLine = normalizeText(line);
    const canonicalLine = canonicalizeAlias(line);
    const lineTypes = getTypesMentionedInLine(line, aliasMap);

    for (const sectionType of lineTypes) {
      for (const variant of KNOWN_VARIANTS) {
        const synonyms = VARIANT_SYNONYMS[variant] ?? [variant];
        if (
          synonyms.some((synonym) =>
            synonym === canonicalizeAlias(synonym)
              ? canonicalLine.includes(synonym)
              : normalizedLine.includes(normalizeText(synonym)),
          )
        ) {
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
  const aliasMap = buildAliasMap(knownTypes);
  return {
    sectionOrder: parseSectionOrder(normalizedPrompt, knownTypes, aliasMap),
    sectionVariants: parseSectionVariants(normalizedPrompt, aliasMap),
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
