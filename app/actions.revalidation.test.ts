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
  it("buildPage revalidates project editor routes and demo route", () => {
    const block = getFunctionBlock(actionsSource, "buildPage");

    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}\/pages\/\$\{pageId\}`\)/);
    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}`\)/);
    assert.match(block, /revalidatePath\(`\/demo\/\$\{savedVersion\.publicSlug\}`\)/);
  });

  it("generateNewVersion revalidates project editor routes and demo route", () => {
    const block = getFunctionBlock(actionsSource, "generateNewVersion");

    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}\/pages\/\$\{pageId\}`\)/);
    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}`\)/);
    assert.match(block, /revalidatePath\(`\/demo\/\$\{savedVersion\.publicSlug\}`\)/);
  });

  it("rollbackToVersion revalidates project editor routes and demo route", () => {
    const block = getFunctionBlock(actionsSource, "rollbackToVersion");

    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}\/pages\/\$\{pageId\}`\)/);
    assert.match(block, /revalidatePath\(`\/projects\/\$\{projectSlug\}`\)/);
    assert.match(block, /revalidatePath\(`\/demo\/\$\{updatedPage\.publicSlug\}`\)/);
  });
});
