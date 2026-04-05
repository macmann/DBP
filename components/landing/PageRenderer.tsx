import type {
  GeneratedBlock,
  GeneratedLayoutEntry,
  GeneratedPageLayout,
  GeneratedPageSchema,
} from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { resolveBlock } from "@/components/landing/blockRegistry";
import { bootstrapBlockRegistry } from "@/components/landing/blockRegistry.bootstrap";
import { ENABLE_V2_BLOCK_LAYOUT_RENDERING } from "@/lib/config/rendering";
import { SectionHeader, SectionShell } from "@/components/landing/sections/shared";

type PageRendererProps = {
  page: GeneratedPageSchema;
  resolveAsset: AssetResolver;
  enableV2LayoutRendering?: boolean;
};

function MalformedBlockPlaceholder({ blockId }: { blockId: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-sm text-amber-800">
      Block <span className="font-mono">{blockId}</span> could not be rendered due to malformed
      props.
    </section>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function GenericBlockFallback({ block }: { block: GeneratedBlock }) {
  const props = isRecord(block.props) ? block.props : {};
  const heading = typeof props.heading === "string" ? props.heading : null;
  const body = typeof props.body === "string" ? props.body : null;
  const items = Array.isArray(props.items)
    ? props.items.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];

  return (
    <SectionShell className="space-y-6">
      <div className="space-y-3">
        <span className="inline-flex items-center rounded-full border border-[var(--dbp-border)] bg-[var(--dbp-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--dbp-muted)]">
          Custom block · <span className="ml-1 font-mono">{block.type}</span>
        </span>
        <SectionHeader
          heading={heading ?? `Custom content block`}
          body={body ?? "Generated as prompt-specific content for this page."}
        />
      </div>

      {items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const itemTitle = typeof item.title === "string" ? item.title : `Item ${index + 1}`;
            const itemBody = typeof item.body === "string" ? item.body : null;
            return (
              <li
                key={`${block.id}-custom-item-${index}`}
                className="rounded-2xl border border-[var(--dbp-border)] bg-[var(--dbp-surface-muted)] px-4 py-3"
              >
                <h3 className="text-sm font-semibold text-[var(--dbp-ink)]">{itemTitle}</h3>
                {itemBody ? <p className="mt-1 text-sm text-[var(--dbp-muted)]">{itemBody}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </SectionShell>
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
    if (isRecord(block.props) || block.props === undefined) {
      return <GenericBlockFallback block={block} />;
    }
    return <UnknownBlockPlaceholder type={block.type} />;
  }

  if (resolved.validator && !resolved.validator(block.props)) {
    return <MalformedBlockPlaceholder blockId={block.id} />;
  }

  const BlockComponent = resolved.component;
  return <BlockComponent block={block} resolveAsset={resolveAsset} />;
}

function normalizeLayoutRegion(region: GeneratedLayoutEntry[] | undefined): GeneratedLayoutEntry[] {
  if (!Array.isArray(region)) {
    return [];
  }

  return region
    .map((entry) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        return trimmed.length > 0 ? trimmed : null;
      }

      if (
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        entry.id.trim().length > 0 &&
        typeof entry.type === "string" &&
        entry.type.trim().length > 0
      ) {
        return {
          ...entry,
          id: entry.id.trim(),
          type: entry.type.trim(),
        } satisfies GeneratedBlock;
      }

      return null;
    })
    .filter((entry): entry is GeneratedLayoutEntry => entry !== null);
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

function getOrderedBlocks(page: GeneratedPageSchema, enableV2LayoutRendering: boolean) {
  const blocks = page.blocks ?? [];
  if (!enableV2LayoutRendering) {
    return {
      orderedBlocks: blocks,
      missingBlockIds: [] as string[],
    };
  }

  const renderableLayout = getRenderableLayout(page);

  if (!renderableLayout) {
    return {
      orderedBlocks: blocks,
      missingBlockIds: [] as string[],
    };
  }

  const blockMap = new Map<string, GeneratedBlock>();
  for (const block of blocks) {
    if (typeof block.id !== "string" || block.id.trim().length === 0) {
      continue;
    }
    blockMap.set(block.id, block);
  }

  const orderedBlocks: GeneratedBlock[] = [];
  const missingBlockIds: string[] = [];

  for (const layoutEntry of [
    ...renderableLayout.top,
    ...renderableLayout.main,
    ...renderableLayout.bottom,
  ]) {
    if (typeof layoutEntry !== "string") {
      orderedBlocks.push(layoutEntry);
      continue;
    }

    const block = blockMap.get(layoutEntry);
    if (!block) {
      missingBlockIds.push(layoutEntry);
      continue;
    }
    orderedBlocks.push(block);
  }

  return {
    orderedBlocks,
    missingBlockIds,
  };
}

export function PageRenderer({
  page,
  resolveAsset,
  enableV2LayoutRendering = ENABLE_V2_BLOCK_LAYOUT_RENDERING,
}: PageRendererProps) {
  bootstrapBlockRegistry();

  const { orderedBlocks, missingBlockIds } = getOrderedBlocks(page, enableV2LayoutRendering);

  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      {orderedBlocks.map((block, index) => {
        const key =
          typeof block.id === "string" && block.id.trim().length > 0 ? block.id : `block-${index}`;

        return (
          <div key={key} className="scroll-mt-24">
            {renderBlock(block, resolveAsset)}
          </div>
        );
      })}

      {missingBlockIds.map((blockId, index) => (
        <div key={`missing-${blockId}-${index}`} className="scroll-mt-24">
          <MissingLayoutBlockPlaceholder blockId={blockId} />
        </div>
      ))}
    </div>
  );
}
