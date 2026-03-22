import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CURRENT_SCHEMA_VERSION = 2;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeBlock(block, fromLegacySections) {
  if (!isRecord(block)) {
    return block;
  }

  if (!fromLegacySections) {
    return { ...block };
  }

  const { layoutVariant, heading, body, items, mediaAssetIds, cta, props, ...rest } = block;
  const nextProps = {
    ...(isRecord(props) ? props : {}),
  };
  if (heading !== undefined) nextProps.heading = heading;
  if (body !== undefined) nextProps.body = body;
  if (items !== undefined) nextProps.items = items;
  if (mediaAssetIds !== undefined) nextProps.mediaAssetIds = mediaAssetIds;
  if (cta !== undefined) nextProps.cta = cta;

  return {
    ...rest,
    ...(layoutVariant !== undefined ? { variant: layoutVariant } : {}),
    ...(Object.keys(nextProps).length > 0 ? { props: nextProps } : {}),
  };
}

function inferDefaultLayout(blocks) {
  const contentBlockIds = blocks
    .map((block) => block.id)
    .filter((id) => typeof id === "string" && id.trim().length > 0);

  return {
    top: [{ id: "shell-page-header", type: "pageHeader" }],
    main: contentBlockIds,
    bottom: [{ id: "shell-widget-embed", type: "widgetEmbed" }, { id: "shell-build-meta", type: "buildMeta" }],
  };
}

function migrateGeneratedSchema(payload) {
  if (!isRecord(payload)) {
    return payload;
  }

  const next = {
    ...payload,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };

  const rawBlocks = Array.isArray(payload.blocks) ? payload.blocks : Array.isArray(payload.sections) ? payload.sections : null;
  if (rawBlocks) {
    const fromLegacySections = !Array.isArray(payload.blocks);
    const normalizedBlocks = rawBlocks.map((block) => normalizeBlock(block, fromLegacySections));
    next.blocks = normalizedBlocks;
    next.sections = normalizedBlocks;

    if (!isRecord(payload.layout)) {
      next.layout = inferDefaultLayout(normalizedBlocks.filter((block) => isRecord(block)));
    } else {
      const layout = {
        ...payload.layout,
      };
      if (!Array.isArray(layout.main)) {
        layout.main = inferDefaultLayout(normalizedBlocks.filter((block) => isRecord(block))).main;
      }
      next.layout = layout;
    }
  }

  return next;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const shouldWrite = process.argv.includes("--write");

async function main() {
  const versions = await prisma.pageVersion.findMany({
    where: {
      generatedSchemaJson: {
        not: null,
      },
    },
    select: {
      id: true,
      pageId: true,
      versionNumber: true,
      generatedSchemaJson: true,
    },
  });

  let changedCount = 0;
  for (const version of versions) {
    const migrated = migrateGeneratedSchema(version.generatedSchemaJson);
    if (deepEqual(migrated, version.generatedSchemaJson)) {
      continue;
    }

    changedCount += 1;
    if (shouldWrite) {
      await prisma.pageVersion.update({
        where: { id: version.id },
        data: { generatedSchemaJson: migrated },
      });
    }
  }

  console.log(
    `${shouldWrite ? "Updated" : "Found"} ${changedCount} version(s) requiring schema compatibility migration out of ${versions.length}.`,
  );
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
