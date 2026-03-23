import type { GeneratedBlock, GeneratedPageLayout, GeneratedPageSchema } from "@/lib/ai/schema";
import {
  SHELL_BUILD_META_ID,
  SHELL_PAGE_HEADER_ID,
  SHELL_WIDGET_EMBED_ID,
} from "@/components/landing/shellBlocks";

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

function normalizeLayoutEntries(entries: string[] | undefined): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
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

function hasRenderableLayoutEntries(layout: GeneratedPageLayout): boolean {
  return layout.top.length > 0 || layout.main.length > 0 || layout.bottom.length > 0;
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

  return normalizedLayout;
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
