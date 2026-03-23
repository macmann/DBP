import { createBlockAdapter, validateCommonProps } from "@/components/landing/blockAdapters";
import { registerBlock } from "@/components/landing/blockRegistry";
import { CTASection } from "@/components/landing/sections/CTASection";
import { FAQSection } from "@/components/landing/sections/FAQSection";
import { FeaturesSection } from "@/components/landing/sections/FeaturesSection";
import { FooterSection } from "@/components/landing/sections/FooterSection";
import { GallerySection } from "@/components/landing/sections/GallerySection";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { ImageTextSection } from "@/components/landing/sections/ImageTextSection";
import { LogoStripSection } from "@/components/landing/sections/LogoStripSection";
import { TestimonialSection } from "@/components/landing/sections/TestimonialSection";
import { registerShellBlocks } from "@/components/landing/shellBlocks";

let initialized = false;

export function bootstrapBlockRegistry() {
  if (initialized) {
    return;
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
  registerShellBlocks();

  initialized = true;
}

bootstrapBlockRegistry();
