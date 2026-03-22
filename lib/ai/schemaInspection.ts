import {
  ALLOWED_SECTION_TYPES,
  type GeneratedBlock,
  type GeneratedPageSchema,
  validateGeneratedPageSchema,
} from "@/lib/ai/schema";

export type BlockInspectionSummary = {
  id: string;
  type: string;
  variant: string | null;
  keyProps: string[];
};

export type SchemaInspectionResult = {
  isValid: boolean;
  validationErrors: string[];
  blockCount: number;
  unknownBlockTypes: string[];
  blocks: BlockInspectionSummary[];
};

const knownBlockTypes = new Set<string>(ALLOWED_SECTION_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function summarizeKeyProps(block: GeneratedBlock): string[] {
  const props = isRecord(block.props) ? block.props : {};
  const keys: string[] = [];

  if (typeof props.heading === "string" || typeof block.heading === "string") keys.push("heading");
  if (typeof props.body === "string" || typeof block.body === "string") keys.push("body");
  if (Array.isArray(props.items) || Array.isArray(block.items)) keys.push("items");
  if (Array.isArray(props.mediaAssetIds) || Array.isArray(block.mediaAssetIds)) keys.push("mediaAssetIds");
  if (isRecord(props.cta) || isRecord(block.cta)) keys.push("cta");

  if (keys.length > 0) {
    return keys;
  }

  const fallbackKeys = Object.keys(props)
    .filter((key) => !["heading", "body", "items", "mediaAssetIds", "cta"].includes(key))
    .slice(0, 4);

  return fallbackKeys.length > 0 ? fallbackKeys : ["none"];
}

function getBlocks(schema: GeneratedPageSchema): GeneratedBlock[] {
  return schema.blocks ?? schema.sections;
}

export function normalizeSchemaForDisplay(payload: unknown): GeneratedPageSchema | null {
  const validated = validateGeneratedPageSchema(payload);
  if (!validated.success) {
    return null;
  }

  return validated.data;
}

export function inspectGeneratedSchema(payload: unknown): SchemaInspectionResult {
  const validated = validateGeneratedPageSchema(payload);
  if (!validated.success) {
    return {
      isValid: false,
      validationErrors: validated.errors,
      blockCount: 0,
      unknownBlockTypes: [],
      blocks: [],
    };
  }

  const blocks = getBlocks(validated.data);
  const unknownBlockTypes = Array.from(
    new Set(blocks.map((block) => block.type).filter((type) => !knownBlockTypes.has(type))),
  );

  return {
    isValid: true,
    validationErrors: [],
    blockCount: blocks.length,
    unknownBlockTypes,
    blocks: blocks.map((block, index) => ({
      id: typeof block.id === "string" && block.id.trim().length > 0 ? block.id : `block-${index + 1}`,
      type: block.type,
      variant:
        typeof block.variant === "string"
          ? block.variant
          : typeof block.layoutVariant === "string"
            ? block.layoutVariant
            : null,
      keyProps: summarizeKeyProps(block),
    })),
  };
}
