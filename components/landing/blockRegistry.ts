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

function normalizeBlockType(type: string): string {
  return type.trim();
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

  blockRegistry.set(normalizedType, {
    type: normalizedType,
    component,
    validator,
  });
}

export function resolveBlock(type: string): BlockRegistration | null {
  const normalizedType = normalizeBlockType(type);

  if (normalizedType.length === 0) {
    return null;
  }

  return blockRegistry.get(normalizedType) ?? null;
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
