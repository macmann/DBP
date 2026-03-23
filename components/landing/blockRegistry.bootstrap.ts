import { createBlockAdapter, validateCommonProps } from "@/components/landing/blockAdapters";
import { registerBlocks } from "@/components/landing/blockRegistry";
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

  registerBlocks([
    {
      type: "hero",
      component: createBlockAdapter(HeroSection),
      validator: validateCommonProps,
    },
    {
      type: "logoStrip",
      component: createBlockAdapter(LogoStripSection),
      validator: validateCommonProps,
    },
    {
      type: "features",
      component: createBlockAdapter(FeaturesSection),
      validator: validateCommonProps,
    },
    {
      type: "imageText",
      component: createBlockAdapter(ImageTextSection),
      validator: validateCommonProps,
    },
    {
      type: "gallery",
      component: createBlockAdapter(GallerySection),
      validator: validateCommonProps,
    },
    {
      type: "testimonial",
      component: createBlockAdapter(TestimonialSection),
      validator: validateCommonProps,
    },
    {
      type: "faq",
      component: createBlockAdapter(FAQSection),
      validator: validateCommonProps,
    },
    {
      type: "cta",
      component: createBlockAdapter(CTASection),
      validator: validateCommonProps,
    },
    {
      type: "footer",
      component: createBlockAdapter(FooterSection),
      validator: validateCommonProps,
    },
  ]);
  registerShellBlocks();

  initialized = true;
}

bootstrapBlockRegistry();
