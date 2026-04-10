import type {
  GeneratedBlock,
  GeneratedLayoutEntry,
  GeneratedPageLayout,
  GeneratedPageSchema,
} from "@/lib/ai/schema";
import {
  SHELL_PAGE_HEADER_ID,
  SHELL_THEME_META_ID,
  SHELL_WIDGET_EMBED_ID,
} from "@/components/landing/shellBlocks";

export type DemoShellBlockType = "pageHeader" | "widgetEmbed" | "themeMeta";

export type DemoRenderSchemaOptions = {
  pageTitleFallback: string;
  currentVersionLabel: string;
  widgetEmbedHtml: string | null | undefined;
  logoAsset?: {
    storageUrl: string;
    fileName: string | null;
  };
};

function normalizeLayoutEntries(entries: GeneratedLayoutEntry[] | undefined): GeneratedLayoutEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
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
        return { ...entry, id: entry.id.trim(), type: entry.type.trim() } satisfies GeneratedBlock;
      }

      return null;
    })
    .filter((entry): entry is GeneratedLayoutEntry => entry !== null);
}

function inferLegacyLayout(blocks: GeneratedBlock[]): GeneratedPageLayout {
  const contentBlockIds = blocks
    .map((block) => block.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  return {
    top: [SHELL_PAGE_HEADER_ID],
    main: contentBlockIds,
    bottom: [SHELL_WIDGET_EMBED_ID, SHELL_THEME_META_ID],
  };
}

function hasRenderableLayoutEntries(layout: GeneratedPageLayout): boolean {
  return layout.top.length > 0 || layout.main.length > 0 || layout.bottom.length > 0;
}

function getLayoutEntryId(entry: GeneratedLayoutEntry): string | null {
  if (typeof entry === "string") {
    return entry;
  }

  return typeof entry.id === "string" ? entry.id : null;
}

function includesAnyShellBlock(layout: GeneratedPageLayout): boolean {
  const shellIds = new Set([SHELL_PAGE_HEADER_ID, SHELL_WIDGET_EMBED_ID, SHELL_THEME_META_ID]);
  const entries = [...layout.top, ...layout.main, ...layout.bottom];

  return entries.some((entry) => {
    const entryId = getLayoutEntryId(entry);
    return entryId ? shellIds.has(entryId) : false;
  });
}

function dedupeAndOrderMainEntries(
  layout: GeneratedPageLayout,
  contentBlocks: GeneratedBlock[],
): GeneratedLayoutEntry[] {
  const heroBlockId = contentBlocks.find((block) => block.type === "hero")?.id;
  const sourceEntries = [...layout.top, ...layout.main, ...layout.bottom];
  const seen = new Set<string>();

  const contentEntries: GeneratedLayoutEntry[] = [];
  for (const entry of sourceEntries) {
    const entryId = getLayoutEntryId(entry);
    if (!entryId) {
      continue;
    }
    if (
      entryId === SHELL_PAGE_HEADER_ID ||
      entryId === SHELL_WIDGET_EMBED_ID ||
      entryId === SHELL_THEME_META_ID
    ) {
      continue;
    }
    if (seen.has(entryId)) {
      continue;
    }
    seen.add(entryId);
    contentEntries.push(entry);
  }

  if (!heroBlockId) {
    return contentEntries;
  }

  const heroIndex = contentEntries.findIndex((entry) => getLayoutEntryId(entry) === heroBlockId);
  if (heroIndex <= 0) {
    return contentEntries;
  }

  const [heroEntry] = contentEntries.splice(heroIndex, 1);
  return [heroEntry, ...contentEntries];
}

function resolveNormalizedLayout(
  schema: GeneratedPageSchema,
  contentBlocks: GeneratedBlock[],
): GeneratedPageLayout {
  if (!schema.layout) {
    return inferLegacyLayout(contentBlocks);
  }

  const normalizedLayout: GeneratedPageLayout = {
    top: normalizeLayoutEntries(schema.layout.top),
    main: normalizeLayoutEntries(schema.layout.main),
    bottom: normalizeLayoutEntries(schema.layout.bottom),
  };

  if (!hasRenderableLayoutEntries(normalizedLayout)) {
    return inferLegacyLayout(contentBlocks);
  }

  if (includesAnyShellBlock(normalizedLayout)) {
    return normalizedLayout;
  }

  return {
    top: [SHELL_PAGE_HEADER_ID],
    main: dedupeAndOrderMainEntries(normalizedLayout, contentBlocks),
    bottom: [SHELL_WIDGET_EMBED_ID, SHELL_THEME_META_ID],
  };
}

export function buildDemoRenderSchema(
  schema: GeneratedPageSchema,
  options: DemoRenderSchemaOptions,
): GeneratedPageSchema {
  const contentBlocks = [...(schema.blocks ?? schema.sections)];
  const blockMap = new Map<string, GeneratedBlock>();

  for (const block of contentBlocks) {
    if (typeof block.id === "string" && block.id.trim().length > 0) {
      blockMap.set(block.id, block);
    }
  }

  const normalizedLayout = resolveNormalizedLayout(schema, contentBlocks);

  const shellBlocks: GeneratedBlock[] = [
    {
      id: SHELL_PAGE_HEADER_ID,
      type: "pageHeader",
      props: {
        pageTitle: schema.pageTitle || options.pageTitleFallback,
        summary: schema.summary,
        alignment: schema.pageHeaderAlignment,
        logoAssetUrl: options.logoAsset?.storageUrl,
        logoAssetFileName: options.logoAsset?.fileName,
      },
    },
    {
      id: SHELL_WIDGET_EMBED_ID,
      type: "widgetEmbed",
      props: {
        html: options.widgetEmbedHtml ?? "",
      },
    },
    {
      id: SHELL_THEME_META_ID,
      type: "themeMeta",
      props: {
        currentVersionLabel: options.currentVersionLabel,
        primaryColor: schema.theme.primaryColor,
        accentColor: schema.theme.accentColor,
        fontFamily: schema.theme.fontFamily,
      },
    },
  ];

  for (const shellBlock of shellBlocks) {
    blockMap.set(shellBlock.id, shellBlock);
  }

  const blocks = [...blockMap.values()];

  return {
    ...schema,
    blocks,
    sections: blocks,
    layout: normalizedLayout,
  };
}
