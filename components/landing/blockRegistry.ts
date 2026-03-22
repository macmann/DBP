import type { ComponentType } from "react";
import type { GeneratedBlock } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { createBlockAdapter, validateCommonProps } from "@/components/landing/blockAdapters";
import { CTASection } from "@/components/landing/sections/CTASection";
import { FAQSection } from "@/components/landing/sections/FAQSection";
import { FeaturesSection } from "@/components/landing/sections/FeaturesSection";
import { FooterSection } from "@/components/landing/sections/FooterSection";
import { GallerySection } from "@/components/landing/sections/GallerySection";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { ImageTextSection } from "@/components/landing/sections/ImageTextSection";
import { LogoStripSection } from "@/components/landing/sections/LogoStripSection";
import { TestimonialSection } from "@/components/landing/sections/TestimonialSection";

export type BlockComponentProps = {
  block: GeneratedBlock;
  resolveAsset: AssetResolver;
};

export type BlockValidator = (props: Record<string, unknown> | undefined) => boolean;

type BlockRegistration = {
  component: ComponentType<BlockComponentProps>;
  validator?: BlockValidator;
};

const blockRegistry = new Map<string, BlockRegistration>([
  ["hero", { component: createBlockAdapter(HeroSection), validator: validateCommonProps }],
  [
    "logoStrip",
    { component: createBlockAdapter(LogoStripSection), validator: validateCommonProps },
  ],
  ["features", { component: createBlockAdapter(FeaturesSection), validator: validateCommonProps }],
  [
    "imageText",
    { component: createBlockAdapter(ImageTextSection), validator: validateCommonProps },
  ],
  ["gallery", { component: createBlockAdapter(GallerySection), validator: validateCommonProps }],
  [
    "testimonial",
    { component: createBlockAdapter(TestimonialSection), validator: validateCommonProps },
  ],
  ["faq", { component: createBlockAdapter(FAQSection), validator: validateCommonProps }],
  ["cta", { component: createBlockAdapter(CTASection), validator: validateCommonProps }],
  ["footer", { component: createBlockAdapter(FooterSection), validator: validateCommonProps }],
]);



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
