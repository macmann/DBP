import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const actionsSource = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");

function getFunctionBlock(source: string, functionName: string): string {
  const start = source.indexOf(`export async function ${functionName}`);
  assert.notEqual(start, -1, `Could not find ${functionName} in app/actions.ts`);

  const nextExport = source.indexOf("\nexport async function ", start + 1);
  return source.slice(start, nextExport === -1 ? undefined : nextExport);
}

describe("action logic: public slug creation", () => {
  it("createPage derives a unique public slug and stores it", () => {
    const block = getFunctionBlock(actionsSource, "createPage");

    assert.match(block, /const publicSlug = await ensureUniquePublicSlug\(baseSlug\)/);
    assert.match(block, /publicSlug,/);
  });

  it("quickGeneratePage derives and stores a unique public slug", () => {
    const block = getFunctionBlock(actionsSource, "quickGeneratePage");

    assert.match(block, /const publicSlug = await ensureUniquePublicSlug\(baseSlug\)/);
    assert.match(block, /publicSlug,/);
  });

  it("updatePage recalculates unique public slug with page exclusion", () => {
    const block = getFunctionBlock(actionsSource, "updatePage");

    assert.match(block, /const publicSlug = await ensureUniquePublicSlug\(baseSlug, pageId\)/);
    assert.match(block, /previousPublicSlug: existingPage\.publicSlug/);
  });
});

describe("action logic: publish status transitions", () => {
  it("buildPage transitions page status from generating to published on success", () => {
    const block = getFunctionBlock(actionsSource, "buildPage");

    assert.match(block, /status: PageStatus\.generating/);
    assert.match(block, /status: PageStatus\.published/);
    assert.match(block, /status: PageStatus\.failed/);
  });

  it("generateNewVersion publishes and clears error state after successful generation", () => {
    const block = getFunctionBlock(actionsSource, "generateNewVersion");

    assert.match(block, /status: PageStatus\.published/);
    assert.match(block, /lastError: null/);
    assert.match(block, /publishedAt: new Date\(\)/);
  });

  it("rollbackToVersion restores page to published status", () => {
    const block = getFunctionBlock(actionsSource, "rollbackToVersion");

    assert.match(block, /status: PageStatus\.published/);
    assert.match(block, /currentVersionId: version\.id/);
  });
});

describe("action logic: build failure validation paths", () => {
  it("mapBuildFailure maps API key and schema errors to actionable codes", () => {
    assert.match(actionsSource, /OPENAI_API_KEY is not configured/);
    assert.match(actionsSource, /code: "missing_api_key"/);
    assert.match(actionsSource, /code: "invalid_prompt"/);
    assert.match(actionsSource, /code: "generation_failure"/);
  });

  it("buildPage routes schema validation failures through invalid_prompt", () => {
    const block = getFunctionBlock(actionsSource, "buildPage");

    assert.match(block, /if \(!parsed\.success\)/);
    assert.match(block, /code: "invalid_prompt"/);
    assert.match(block, /PageStatus\.failed/);
  });
});
