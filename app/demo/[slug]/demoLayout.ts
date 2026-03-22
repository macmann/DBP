import type { GeneratedBlock, GeneratedLayoutEntry, GeneratedPageLayout, GeneratedPageSchema } from "@/lib/ai/schema";

const SHELL_PAGE_HEADER_ID = "shell-page-header";
const SHELL_WIDGET_EMBED_ID = "shell-widget-embed";
const SHELL_BUILD_META_ID = "shell-build-meta";

export type DemoShellBlockType = "pageHeader" | "widgetEmbed" | "buildMeta";

export type DemoRenderSchemaOptions = {
  pageTitleFallback: string;
  currentVersionLabel: string;
  widgetEmbedHtml: string | null | undefined;
  logoAsset?: {
    storageUrl: string;
    fileName: string | null;
  };
};

function isGeneratedBlock(entry: GeneratedLayoutEntry): entry is GeneratedBlock {
  return typeof entry === "object" && entry !== null;
}

function normalizeLayoutEntries(
  entries: GeneratedLayoutEntry[] | undefined,
  knownBlocks: Map<string, GeneratedBlock>,
): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const ids: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      const id = entry.trim();
      if (id.length > 0) {
        ids.push(id);
      }
      continue;
    }

    if (!isGeneratedBlock(entry)) {
      continue;
    }

    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const type = typeof entry.type === "string" ? entry.type.trim() : "";
    if (id.length === 0 || type.length === 0) {
      continue;
    }

    if (!knownBlocks.has(id)) {
      knownBlocks.set(id, entry);
    }
    ids.push(id);
  }

  return ids;
}

function inferLegacyLayout(blocks: GeneratedBlock[]): GeneratedPageLayout {
  const contentBlockIds = blocks
    .map((block) => block.id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  return {
    top: [SHELL_PAGE_HEADER_ID],
    main: contentBlockIds,
    bottom: [SHELL_WIDGET_EMBED_ID, SHELL_BUILD_META_ID],
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

  const normalizedLayout = schema.layout
    ? {
        top: normalizeLayoutEntries(schema.layout.top, blockMap),
        main: normalizeLayoutEntries(schema.layout.main, blockMap),
        bottom: normalizeLayoutEntries(schema.layout.bottom, blockMap),
      }
    : inferLegacyLayout(contentBlocks);

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
      id: SHELL_BUILD_META_ID,
      type: "buildMeta",
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
