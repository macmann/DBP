import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { ensureUniqueSlug } from "./ensureUniqueSlug";

describe("ensureUniqueSlug", () => {
  it("returns base slug when no collision exists", async () => {
    const slug = await ensureUniqueSlug("landing", async () => false);
    assert.equal(slug, "landing");
  });

  it("handles two pages in different projects sharing the same editor slug", async () => {
    const existingPublicSlugs = new Set(["pricing"]);

    const secondPagePublicSlug = await ensureUniqueSlug(
      "pricing",
      async (candidate) => existingPublicSlugs.has(candidate),
    );

    assert.equal(secondPagePublicSlug, "pricing-1");
  });
});
