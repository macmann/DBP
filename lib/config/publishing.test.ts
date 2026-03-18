import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import {
  buildCanonicalPublicPath,
  getPublicPathsToRevalidate,
  RESERVED_PUBLIC_SLUGS,
} from "./publishing";

describe("publishing config", () => {
  it("keeps /demo/{slug} as canonical public path", () => {
    assert.equal(buildCanonicalPublicPath("my-demo"), "/demo/my-demo");
  });

  it("tracks route guard reserved words", () => {
    assert.equal(RESERVED_PUBLIC_SLUGS.has("demo"), true);
    assert.equal(RESERVED_PUBLIC_SLUGS.has("projects"), true);
  });

  it("revalidates both previous and current canonical URLs when public slug changes", () => {
    const paths = getPublicPathsToRevalidate({
      projectSlug: "alpha",
      previousPublicSlug: "old-slug",
      currentPublicSlug: "new-slug",
    });

    assert.deepEqual(
      new Set(paths),
      new Set(["/demo/new-slug", "/demo/old-slug"]),
    );
  });
});
