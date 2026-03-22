import type { GeneratedBlock, GeneratedSection } from "@/lib/ai/schema";
import type { ReactNode } from "react";
import { registerBlock, type BlockComponentProps } from "@/components/landing/blockRegistry";
import { CTASection } from "@/components/landing/sections/CTASection";
import { FAQSection } from "@/components/landing/sections/FAQSection";
import { FeaturesSection } from "@/components/landing/sections/FeaturesSection";
import { FooterSection } from "@/components/landing/sections/FooterSection";
import { GallerySection } from "@/components/landing/sections/GallerySection";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { ImageTextSection } from "@/components/landing/sections/ImageTextSection";
import { LogoStripSection } from "@/components/landing/sections/LogoStripSection";
import { TestimonialSection } from "@/components/landing/sections/TestimonialSection";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSection(block: GeneratedBlock): GeneratedSection {
  const props = isRecord(block.props) ? block.props : {};

  return {
    ...block,
    layoutVariant:
      typeof block.variant === "string"
        ? block.variant
        : typeof block.layoutVariant === "string"
          ? block.layoutVariant
          : undefined,
    heading:
      typeof props.heading === "string"
        ? props.heading
        : typeof block.heading === "string"
          ? block.heading
          : undefined,
    body:
      typeof props.body === "string"
        ? props.body
        : typeof block.body === "string"
          ? block.body
          : undefined,
    items: Array.isArray(props.items)
      ? (props.items.filter((item): item is Record<string, unknown> => isRecord(item)) as Array<
          Record<string, unknown>
        >)
      : Array.isArray(block.items)
        ? block.items
        : undefined,
    mediaAssetIds: Array.isArray(props.mediaAssetIds)
      ? props.mediaAssetIds.filter((value): value is string => typeof value === "string")
      : Array.isArray(block.mediaAssetIds)
        ? block.mediaAssetIds
        : undefined,
    cta: isRecord(props.cta)
      ? {
          label: typeof props.cta.label === "string" ? props.cta.label : "",
          href: typeof props.cta.href === "string" ? props.cta.href : "",
        }
      : block.cta,
  };
}

function validateCommonProps(props: Record<string, unknown> | undefined): boolean {
  if (props === undefined) {
    return true;
  }

  if (!isRecord(props)) {
    return false;
  }

  if (props.heading !== undefined && typeof props.heading !== "string") {
    return false;
  }

  if (props.body !== undefined && typeof props.body !== "string") {
    return false;
  }

  if (
    props.items !== undefined &&
    (!Array.isArray(props.items) ||
      props.items.some((item) => typeof item !== "object" || item === null || Array.isArray(item)))
  ) {
    return false;
  }

  if (
    props.mediaAssetIds !== undefined &&
    (!Array.isArray(props.mediaAssetIds) ||
      props.mediaAssetIds.some((assetId) => typeof assetId !== "string"))
  ) {
    return false;
  }

  if (props.cta !== undefined) {
    if (!isRecord(props.cta)) {
      return false;
    }

    if (typeof props.cta.label !== "string" || typeof props.cta.href !== "string") {
      return false;
    }
  }

  return true;
}

function createBlockAdapter(
  SectionComponent: (props: { section: GeneratedSection; resolveAsset: BlockComponentProps["resolveAsset"] }) => ReactNode,
) {
  return function BlockAdapter({ block, resolveAsset }: BlockComponentProps) {
    return <SectionComponent section={toSection(block)} resolveAsset={resolveAsset} />;
  };
}

registerBlock("hero", createBlockAdapter(HeroSection), validateCommonProps);
registerBlock("logoStrip", createBlockAdapter(LogoStripSection), validateCommonProps);
registerBlock("features", createBlockAdapter(FeaturesSection), validateCommonProps);
registerBlock("imageText", createBlockAdapter(ImageTextSection), validateCommonProps);
registerBlock("gallery", createBlockAdapter(GallerySection), validateCommonProps);
registerBlock("testimonial", createBlockAdapter(TestimonialSection), validateCommonProps);
registerBlock("faq", createBlockAdapter(FAQSection), validateCommonProps);
registerBlock("cta", createBlockAdapter(CTASection), validateCommonProps);
registerBlock("footer", createBlockAdapter(FooterSection), validateCommonProps);
