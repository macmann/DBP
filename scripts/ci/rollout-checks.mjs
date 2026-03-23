import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function validateSchemaBaseline(payload) {
  assert.equal(typeof payload, "object");
  assert.ok(payload);
  assert.equal(payload.schemaVersion, 2);
  assert.equal(typeof payload.pageTitle, "string");
  assert.ok(Array.isArray(payload.blocks));
  assert.ok(Array.isArray(payload.layout?.top));
  assert.ok(Array.isArray(payload.layout?.main));
  assert.ok(Array.isArray(payload.layout?.bottom));
}

function getOrderedBlocks(payload, enableV2LayoutRendering) {
  if (!enableV2LayoutRendering || !payload.layout) {
    return {
      orderedBlocks: payload.blocks,
      missingBlockIds: [],
    };
  }

  const blockMap = new Map(payload.blocks.map((block) => [block.id, block]));
  const orderedBlocks = [];
  const missingBlockIds = [];

  for (const entry of [...payload.layout.top, ...payload.layout.main, ...payload.layout.bottom]) {
    if (typeof entry !== "string") {
      orderedBlocks.push(entry);
      continue;
    }

    const block = blockMap.get(entry);
    if (!block) {
      missingBlockIds.push(entry);
      continue;
    }

    orderedBlocks.push(block);
  }

  return {
    orderedBlocks,
    missingBlockIds,
  };
}

function migrateLegacySectionsPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.blocks) || !Array.isArray(payload.sections)) {
    return payload;
  }

  const blocks = payload.sections.map((section) => {
    const { layoutVariant, heading, body, items, mediaAssetIds, cta, props, ...rest } = section;
    const nextProps = { ...(props && typeof props === "object" && !Array.isArray(props) ? props : {}) };

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
  });

  return {
    ...payload,
    schemaVersion: 2,
    blocks,
    layout: payload.layout ?? {
      top: ["shell-page-header"],
      main: blocks.map((block) => block.id).filter((id) => typeof id === "string" && id.length > 0),
      bottom: ["shell-widget-embed", "shell-build-meta"],
    },
  };
}

function validateArchetypeSnapshots() {
  const snapshot = readJson("lib/ai/fixtures/page-archetypes.snap.json");

  for (const item of snapshot.archetypes) {
    const fixture = readJson(`lib/ai/fixtures/page-archetypes/${item.fixture}.json`);
    validateSchemaBaseline(fixture);

    assert.deepEqual(
      fixture.blocks.map((block) => block.type),
      item.expectedBlockTypes,
      `${item.fixture}: expected block types changed`,
    );

    assert.equal(
      fixture.layout.main.length,
      item.expectedMainLayoutLength,
      `${item.fixture}: expected main layout length changed`,
    );
  }
}

function validateFallbackBehavior() {
  const shortLp = readJson("lib/ai/fixtures/page-archetypes/short-lp.json");

  const legacyOrdering = getOrderedBlocks(shortLp, false).orderedBlocks;
  assert.equal(legacyOrdering[0].id, "hero-1");
  assert.equal(legacyOrdering[1].id, "cta-1");

  const missingLayoutFixture = {
    ...shortLp,
    layout: {
      top: ["missing-1"],
      main: ["hero-1"],
      bottom: [],
    },
  };

  const withMissing = getOrderedBlocks(missingLayoutFixture, true);
  assert.deepEqual(withMissing.missingBlockIds, ["missing-1"]);

  const unknownBlockFixture = readJson("lib/ai/fixtures/unknown-block-type-v2.json");
  const unknownBlock = unknownBlockFixture.blocks.find((block) => block.type === "socialProofWall");
  assert.ok(unknownBlock, "unknown block fixture should contain an unsupported block type");
}

function validateLegacyCompatibility() {
  const legacy = readJson("lib/ai/fixtures/saved-version-v1.json");
  const migrated = migrateLegacySectionsPayload(legacy);
  validateSchemaBaseline(migrated);
  assert.ok(Array.isArray(migrated.blocks));
  assert.equal(migrated.schemaVersion, 2);
}

validateArchetypeSnapshots();
validateFallbackBehavior();
validateLegacyCompatibility();

console.log("Rollout checks passed: schema parse/validate, fallback behavior, legacy compatibility.");
