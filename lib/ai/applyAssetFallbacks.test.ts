import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
import { applyAssetFallbacks } from "@/lib/ai/applyAssetFallbacks";

const baseSchema: GeneratedPageSchema = {
  pageTitle: "Launch page",
  summary: "Summary",
  theme: {
    primaryColor: "#111111",
    accentColor: "#eeeeee",
    fontFamily: "Inter",
  },
  seo: {
    title: "SEO title",
    description: "SEO description",
  },
  sections: [
    { id: "hero-1", type: "hero", heading: "Hero" },
    { id: "logo-1", type: "logoStrip", heading: "Logos" },
    { id: "gallery-1", type: "gallery", heading: "Gallery" },
  ],
};

describe("applyAssetFallbacks", () => {
  it("assigns fallback media ids for visual sections and seo image", () => {
    const result = applyAssetFallbacks(baseSchema, [
      { id: "logo-a", type: "logo", mimeType: "image/png" },
      { id: "shot-a", type: "screenshot", mimeType: "image/jpeg" },
      { id: "shot-b", type: "image", mimeType: "image/webp" },
    ]);

    assert.deepEqual(result.sections[0].mediaAssetIds, ["shot-a"]);
    assert.deepEqual(result.sections[1].mediaAssetIds, ["logo-a"]);
    assert.deepEqual(result.sections[2].mediaAssetIds, ["shot-a", "shot-b"]);
    assert.equal(result.seo.ogImageAssetId, "shot-a");
  });

  it("keeps valid existing ids and removes invalid ids", () => {
    const schema: GeneratedPageSchema = {
      ...baseSchema,
      seo: {
        ...baseSchema.seo,
        ogImageAssetId: "missing-id",
      },
      sections: [
        {
          id: "hero-1",
          type: "hero",
          heading: "Hero",
          mediaAssetIds: ["invalid", "shot-a"],
        },
      ],
    };

    const result = applyAssetFallbacks(schema, [
      { id: "shot-a", type: "image", mimeType: "image/png" },
    ]);

    assert.deepEqual(result.sections[0].mediaAssetIds, ["shot-a"]);
    assert.equal(result.seo.ogImageAssetId, "shot-a");
  });
});
