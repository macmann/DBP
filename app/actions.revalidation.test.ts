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

describe("page publishing actions revalidation", () => {
  it("buildPage revalidates project editor routes and public demo paths", () => {
    const block = getFunctionBlock(actionsSource, "buildPage");

    assert.match(block, /revalidateProjectAndPublicPaths\(\{/);
    assert.match(block, /currentPublicSlug: savedVersion\.publicSlug/);
  });

  it("generateNewVersion revalidates project editor routes and public demo paths", () => {
    const block = getFunctionBlock(actionsSource, "generateNewVersion");

    assert.match(block, /revalidateProjectAndPublicPaths\(\{/);
    assert.match(block, /currentPublicSlug: savedVersion\.publicSlug/);
  });

  it("updatePage revalidates both old and new public slugs", () => {
    const block = getFunctionBlock(actionsSource, "updatePage");

    assert.match(block, /revalidateProjectAndPublicPaths\(\{/);
    assert.match(block, /previousPublicSlug: existingPage\.publicSlug/);
    assert.match(block, /currentPublicSlug: publicSlug/);
  });

  it("rollbackToVersion revalidates project editor routes and public demo paths", () => {
    const block = getFunctionBlock(actionsSource, "rollbackToVersion");

    assert.match(block, /revalidateProjectAndPublicPaths\(\{/);
    assert.match(block, /currentPublicSlug: updatedPage\.publicSlug/);
  });

  it("deletePage revalidates project routes and deleted public paths", () => {
    const block = getFunctionBlock(actionsSource, "deletePage");

    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}`\)/);
    assert.match(block, /currentPublicSlug: page\.publicSlug/);
  });

  it("deleteProject revalidates dashboard and project listing routes", () => {
    const block = getFunctionBlock(actionsSource, "deleteProject");

    assert.match(block, /revalidatePath\("\/dashboard"\)/);
    assert.match(block, /revalidatePath\("\/projects"\)/);
    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}`\)/);
  });
});
