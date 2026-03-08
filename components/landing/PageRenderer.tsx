import type { GeneratedPageSchema, GeneratedSection } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { CTASection } from "@/components/landing/sections/CTASection";
import { FAQSection } from "@/components/landing/sections/FAQSection";
import { FeaturesSection } from "@/components/landing/sections/FeaturesSection";
import { FooterSection } from "@/components/landing/sections/FooterSection";
import { GallerySection } from "@/components/landing/sections/GallerySection";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { ImageTextSection } from "@/components/landing/sections/ImageTextSection";
import { LogoStripSection } from "@/components/landing/sections/LogoStripSection";
import { TestimonialSection } from "@/components/landing/sections/TestimonialSection";

type PageRendererProps = {
  page: GeneratedPageSchema;
  resolveAsset: AssetResolver;
};

function MalformedSectionPlaceholder({ sectionId }: { sectionId: string }) {
  return (
    <section className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      Section <span className="font-mono">{sectionId}</span> could not be rendered due to malformed content.
    </section>
  );
}

function UnknownSectionPlaceholder({ type }: { type: string }) {
  return (
    <section className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
      Unsupported section type: <span className="font-mono">{type}</span>
    </section>
  );
}

function renderSection(section: GeneratedSection, resolveAsset: AssetResolver) {
  if (typeof section.id !== "string" || section.id.trim().length === 0) {
    return <MalformedSectionPlaceholder sectionId="unknown" />;
  }

  const props = { section, resolveAsset };

  switch (section.type) {
    case "hero":
      return <HeroSection {...props} />;
    case "logoStrip":
      return <LogoStripSection {...props} />;
    case "features":
      return <FeaturesSection {...props} />;
    case "imageText":
      return <ImageTextSection {...props} />;
    case "gallery":
      return <GallerySection {...props} />;
    case "testimonial":
      return <TestimonialSection {...props} />;
    case "faq":
      return <FAQSection {...props} />;
    case "cta":
      return <CTASection {...props} />;
    case "footer":
      return <FooterSection {...props} />;
    default:
      return <UnknownSectionPlaceholder type={String(section.type)} />;
  }
}

export function PageRenderer({ page, resolveAsset }: PageRendererProps) {
  return (
    <div className="space-y-8">
      {page.sections.map((section) => (
        <div key={section.id}>{renderSection(section, resolveAsset)}</div>
      ))}
    </div>
  );
}
