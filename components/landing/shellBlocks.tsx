import Image from "next/image";
import type { GeneratedBlock } from "@/lib/ai/schema";
import { registerBlock } from "@/components/landing/blockRegistry";
import { WidgetEmbed } from "@/components/landing/WidgetEmbed";
import { PRODUCT_NAME } from "@/lib/config/brand";

export const SHELL_PAGE_HEADER_ID = "shell-page-header";
export const SHELL_WIDGET_EMBED_ID = "shell-widget-embed";
export const SHELL_BUILD_META_ID = "shell-build-meta";

const SITE_DEFAULT_TITLE = PRODUCT_NAME;

function PageHeaderBlock({ block }: { block: GeneratedBlock }) {
  const props = block.props && typeof block.props === "object" ? block.props : {};
  const normalizedHeaderAlignment =
    typeof props.alignment === "string" && props.alignment.trim().toLowerCase() === "center"
      ? "center"
      : "left";
  const isPageHeaderCentered = normalizedHeaderAlignment === "center";
  const logoAssetUrl = typeof props.logoAssetUrl === "string" ? props.logoAssetUrl : "";
  const logoAssetFileName =
    typeof props.logoAssetFileName === "string" && props.logoAssetFileName.trim().length > 0
      ? props.logoAssetFileName
      : "Brand logo";
  const pageTitle = typeof props.pageTitle === "string" ? props.pageTitle : SITE_DEFAULT_TITLE;
  const summary = typeof props.summary === "string" ? props.summary : "";

  return (
    <header
      className={`max-w-3xl space-y-4 ${isPageHeaderCentered ? "mx-auto text-center" : "text-left"}`}
    >
      {logoAssetUrl ? (
        <div className={`relative h-12 w-28 sm:h-14 sm:w-32 ${isPageHeaderCentered ? "mx-auto" : ""}`}>
          <Image
            src={logoAssetUrl}
            alt={logoAssetFileName}
            fill
            unoptimized
            sizes="(max-width: 640px) 112px, 128px"
            className="object-contain"
          />
        </div>
      ) : null}
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--dbp-ink)] sm:text-4xl lg:text-5xl">
        {pageTitle}
      </h1>
      {summary ? (
        <p className="text-pretty text-base leading-7 text-[var(--dbp-muted)] sm:text-lg">{summary}</p>
      ) : null}
    </header>
  );
}

function BuildMetaBlock({ block }: { block: GeneratedBlock }) {
  const props = block.props && typeof block.props === "object" ? block.props : {};
  const currentVersionLabel =
    typeof props.currentVersionLabel === "string" && props.currentVersionLabel.trim().length > 0
      ? props.currentVersionLabel
      : "v?";
  const primaryColor = typeof props.primaryColor === "string" ? props.primaryColor : "#111827";
  const accentColor = typeof props.accentColor === "string" ? props.accentColor : "#3B82F6";
  const fontFamily = typeof props.fontFamily === "string" ? props.fontFamily : "Inter";

  return (
    <footer className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-xs text-muted sm:px-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="font-medium text-fg">Build {currentVersionLabel}</span>
        <span>Theme:</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: primaryColor }}
            aria-hidden
          />
          <code>{primaryColor}</code>
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
          <code>{accentColor}</code>
        </span>
        <span>Font: {fontFamily}</span>
      </div>
    </footer>
  );
}

function WidgetEmbedBlock({ block }: { block: GeneratedBlock }) {
  const props = block.props && typeof block.props === "object" ? block.props : {};
  const html = typeof props.html === "string" ? props.html : "";

  if (!html) {
    return null;
  }

  return <WidgetEmbed html={html} />;
}

let shellBlocksRegistered = false;

export function registerShellBlocks() {
  if (shellBlocksRegistered) {
    return;
  }

  registerBlock("pageHeader", ({ block }) => <PageHeaderBlock block={block} />);
  registerBlock("buildMeta", ({ block }) => <BuildMetaBlock block={block} />);
  registerBlock("widgetEmbed", ({ block }) => <WidgetEmbedBlock block={block} />);

  shellBlocksRegistered = true;
}
