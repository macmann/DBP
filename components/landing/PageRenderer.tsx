import type { GeneratedBlock, GeneratedPageLayout, GeneratedPageSchema } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { resolveBlock } from "@/components/landing/blockRegistry";
import "@/components/landing/blockRegistry.bootstrap";

type PageRendererProps = {
  page: GeneratedPageSchema;
  resolveAsset: AssetResolver;
};

function MalformedBlockPlaceholder({ blockId }: { blockId: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-sm text-amber-800">
      Block <span className="font-mono">{blockId}</span> could not be rendered due to malformed
      props.
    </section>
  );
}

function UnknownBlockPlaceholder({ type }: { type: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-6 text-sm text-neutral-600">
      Unsupported block type: <span className="font-mono">{type}</span>
    </section>
  );
}

function MissingLayoutBlockPlaceholder({ blockId }: { blockId: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-sm text-amber-800">
      Layout references missing block ID: <span className="font-mono">{blockId}</span>
    </section>
  );
}

function renderBlock(block: GeneratedBlock, resolveAsset: AssetResolver) {
  if (typeof block.id !== "string" || block.id.trim().length === 0) {
    return <MalformedBlockPlaceholder blockId="unknown" />;
  }

  if (typeof block.type !== "string" || block.type.trim().length === 0) {
    return <MalformedBlockPlaceholder blockId={block.id} />;
  }

  const resolved = resolveBlock(block.type);

  if (!resolved) {
    return <UnknownBlockPlaceholder type={block.type} />;
  }

  if (resolved.validator && !resolved.validator(block.props)) {
    return <MalformedBlockPlaceholder blockId={block.id} />;
  }

  const BlockComponent = resolved.component;
  return <BlockComponent block={block} resolveAsset={resolveAsset} />;
}

function normalizeLayoutRegion(region: string[] | undefined): string[] {
  if (!Array.isArray(region)) {
    return [];
  }

  return region
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

function getRenderableLayout(page: GeneratedPageSchema): GeneratedPageLayout | null {
  if (!page.layout) {
    return null;
  }

  const normalized: GeneratedPageLayout = {
    top: normalizeLayoutRegion(page.layout.top),
    main: normalizeLayoutRegion(page.layout.main),
    bottom: normalizeLayoutRegion(page.layout.bottom),
  };

  const hasRenderableEntries =
    normalized.top.length > 0 || normalized.main.length > 0 || normalized.bottom.length > 0;

  return hasRenderableEntries ? normalized : null;
}

export function PageRenderer({ page, resolveAsset }: PageRendererProps) {
  const blockMap = new Map<string, GeneratedBlock>();

  for (const block of page.blocks ?? []) {
    if (typeof block.id !== "string" || block.id.trim().length === 0) {
      continue;
    }
    blockMap.set(block.id, block);
  }

  const renderableLayout = getRenderableLayout(page);

  const renderOrder = renderableLayout
    ? [...renderableLayout.top, ...renderableLayout.main, ...renderableLayout.bottom]
    : (page.blocks ?? []).map((block) => block.id);

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      {renderOrder.map((blockId, index) => {
        const key =
          typeof blockId === "string" && blockId.trim().length > 0 ? blockId : `block-${index}`;
        const block = blockMap.get(blockId);

        return (
          <div key={key} className="scroll-mt-24">
            {block ? (
              renderBlock(block, resolveAsset)
            ) : (
              <MissingLayoutBlockPlaceholder blockId={blockId} />
            )}
          </div>
        );
      })}
    </div>
  );
}
