import type { ComponentType } from "react";
import type { GeneratedBlock } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";

export type BlockComponentProps = {
  block: GeneratedBlock;
  resolveAsset: AssetResolver;
};

export type BlockValidator = (props: Record<string, unknown> | undefined) => boolean;

export type BlockRegistration = {
  type: string;
  component: ComponentType<BlockComponentProps>;
  validator?: BlockValidator;
};

const blockRegistry = new Map<string, BlockRegistration>();
const blockRegistryByCanonicalType = new Map<string, BlockRegistration>();

function normalizeBlockType(type: string): string {
  return type.trim();
}

function canonicalizeBlockType(type: string): string {
  return type
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeKnownAlias(type: string): string {
  const canonicalType = canonicalizeBlockType(type);

  switch (canonicalType) {
    case "featuregrid":
    case "featurelist":
    case "stats":
    case "processsteps":
    case "casestudies":
      return "features";
    case "testimonials":
      return "testimonial";
    case "ctaform":
    case "leadform":
      return "cta";
    case "navbar":
      return "pageHeader";
    default:
      return type.trim();
  }
}

export function registerBlock(
  type: string,
  component: ComponentType<BlockComponentProps>,
  validator?: BlockValidator,
): void {
  const normalizedType = normalizeBlockType(type);

  if (normalizedType.length === 0) {
    return;
  }

  const registration = {
    type: normalizedType,
    component,
    validator,
  };

  blockRegistry.set(normalizedType, registration);
  blockRegistryByCanonicalType.set(canonicalizeBlockType(normalizedType), registration);
}

export function resolveBlock(type: string): BlockRegistration | null {
  const normalizedType = normalizeBlockType(type);

  if (normalizedType.length === 0) {
    return null;
  }

  const exactMatch = blockRegistry.get(normalizedType);
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedAliasType = normalizeKnownAlias(normalizedType);
  const aliasMatch = blockRegistry.get(normalizedAliasType);
  if (aliasMatch) {
    return aliasMatch;
  }

  return blockRegistryByCanonicalType.get(canonicalizeBlockType(normalizedAliasType)) ?? null;
}

export function registerBlocks(
  registrations: Array<{
    type: string;
    component: ComponentType<BlockComponentProps>;
    validator?: BlockValidator;
  }>,
): void {
  for (const registration of registrations) {
    registerBlock(registration.type, registration.component, registration.validator);
  }
}
