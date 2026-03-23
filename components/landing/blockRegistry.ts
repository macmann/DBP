import type { ComponentType } from "react";
import type { GeneratedBlock } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";

export type BlockComponentProps = {
  block: GeneratedBlock;
  resolveAsset: AssetResolver;
};

export type BlockValidator = (props: Record<string, unknown> | undefined) => boolean;

type BlockRegistration = {
  component: ComponentType<BlockComponentProps>;
  validator?: BlockValidator;
};

const blockRegistry = new Map<string, BlockRegistration>();

export function registerBlock(
  type: string,
  component: ComponentType<BlockComponentProps>,
  validator?: BlockValidator,
): void {
  blockRegistry.set(type, { component, validator });
}

export function resolveBlock(type: string): BlockRegistration | null {
  return blockRegistry.get(type) ?? null;
}
