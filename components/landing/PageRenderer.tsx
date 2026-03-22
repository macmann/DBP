import type { GeneratedBlock, GeneratedPageSchema } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { resolveBlock } from "@/components/landing/blockRegistry";
import "@/components/landing/blockAdapters";

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

function renderBlock(block: GeneratedBlock, resolveAsset: AssetResolver) {
  if (typeof block.id !== "string" || block.id.trim().length === 0) {
    return <MalformedBlockPlaceholder blockId="unknown" />;
  }

  const resolved = resolveBlock(String(block.type));

  if (!resolved) {
    return <UnknownBlockPlaceholder type={String(block.type)} />;
  }

  if (resolved.validator && !resolved.validator(block.props)) {
    return <MalformedBlockPlaceholder blockId={block.id} />;
  }

  const BlockComponent = resolved.component;
  return <BlockComponent block={block} resolveAsset={resolveAsset} />;
}

export function PageRenderer({ page, resolveAsset }: PageRendererProps) {
  const blocks = page.blocks ?? page.sections;

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      {blocks.map((block, index) => (
        <div
          key={typeof block.id === "string" && block.id.trim().length > 0 ? block.id : `block-${index}`}
          className="scroll-mt-24"
        >
          {renderBlock(block, resolveAsset)}
        </div>
      ))}
    </div>
  );
}
