import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
import { validateGeneratedPageSchema } from "@/lib/ai/schema";
import legacySavedVersionFixture from "@/lib/ai/fixtures/saved-version-v1.json";
import currentSavedVersionFixture from "@/lib/ai/fixtures/saved-version-v2.json";
import { buildDemoRenderSchema } from "./demoLayout";

function buildSchema(overrides?: Partial<GeneratedPageSchema>): GeneratedPageSchema {
  const blocks = [
    {
      id: "hero-1",
      type: "hero",
      props: {
        heading: "Legacy hero",
      },
    },
    {
      id: "faq-1",
      type: "faq",
      props: {
        heading: "Legacy faq",
      },
    },
  ];

  return {
    pageTitle: "Legacy Page",
    summary: "Legacy summary",
    theme: {
      primaryColor: "#111827",
      accentColor: "#3B82F6",
      fontFamily: "Inter",
    },
    seo: {
      title: "Legacy",
      description: "Legacy description",
    },
    blocks,
    sections: blocks,
    ...overrides,
  };
}

describe("buildDemoRenderSchema", () => {
  it("applies legacy layout mapping when published schema has no layout", () => {
    const schema = buildSchema({ layout: undefined });

    const result = buildDemoRenderSchema(schema, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v12",
      widgetEmbedHtml: "",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-page-header"],
      main: ["hero-1", "faq-1"],
      bottom: ["shell-widget-embed", "shell-build-meta"],
    });
  });

  it("normalizes inline layout entries to ID references and preserves embedded HTML safely", () => {
    const schema = buildSchema({
      layout: {
        top: ["shell-page-header"],
        main: ["hero-1", "promo-inline"],
        bottom: ["shell-widget-embed", "shell-build-meta"],
      },
      blocks: [
        ...buildSchema().blocks,
        { id: "promo-inline", type: "cta", props: { heading: "Promo" } },
      ],
    });

    const result = buildDemoRenderSchema(schema, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v2",
      widgetEmbedHtml: "<script>alert('safe-render-through-widget')</script>",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-page-header"],
      main: ["hero-1", "promo-inline"],
      bottom: ["shell-widget-embed", "shell-build-meta"],
    });

    const widgetBlock = result.blocks?.find((block) => block.id === "shell-widget-embed");
    assert.equal(widgetBlock?.type, "widgetEmbed");
    assert.equal(widgetBlock?.props?.html, "<script>alert('safe-render-through-widget')</script>");
    assert.ok(result.blocks?.some((block) => block.id === "promo-inline"));
  });

  it("keeps legacy published fixtures renderable through inferred shell layout", () => {
    const parsed = validateGeneratedPageSchema(legacySavedVersionFixture);
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      throw new Error("Expected validation success");
    }

    const result = buildDemoRenderSchema(parsed.data, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v1",
      widgetEmbedHtml: "",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-page-header"],
      main: ["hero-legacy", "features-legacy"],
      bottom: ["shell-widget-embed", "shell-build-meta"],
    });
  });

  it("keeps modern published fixtures renderable with explicit layout IDs", () => {
    const parsed = validateGeneratedPageSchema(currentSavedVersionFixture);
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      throw new Error("Expected validation success");
    }

    const result = buildDemoRenderSchema(parsed.data, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v2",
      widgetEmbedHtml: "",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-page-header"],
      main: ["hero-modern"],
      bottom: ["shell-build-meta"],
    });
  });

  it("falls back to legacy shell composition when layout is present but empty", () => {
    const schema = buildSchema({
      layout: {
        top: ["   "],
        main: [],
        bottom: [""],
      },
    });

    const result = buildDemoRenderSchema(schema, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v2",
      widgetEmbedHtml: "",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-page-header"],
      main: ["hero-1", "faq-1"],
      bottom: ["shell-widget-embed", "shell-build-meta"],
    });
  });

  it("keeps schema-driven region composition for explicit shell block placement", () => {
    const schema = buildSchema({
      layout: {
        top: ["shell-build-meta"],
        main: ["shell-page-header", "hero-1"],
        bottom: ["faq-1", "shell-widget-embed"],
      },
    });

    const result = buildDemoRenderSchema(schema, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v9",
      widgetEmbedHtml: "<div>embed</div>",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-build-meta"],
      main: ["shell-page-header", "hero-1"],
      bottom: ["faq-1", "shell-widget-embed"],
    });

    const blockTypes = new Map(result.blocks?.map((block) => [block.id, block.type]));
    assert.equal(blockTypes.get("shell-page-header"), "pageHeader");
    assert.equal(blockTypes.get("shell-widget-embed"), "widgetEmbed");
    assert.equal(blockTypes.get("shell-build-meta"), "themeMeta");
  });

  it("accepts inline layout block refs for v2 composition", () => {
    const schema = buildSchema({
      layout: {
        top: [{ id: "inline-top", type: "cta", props: { heading: "Inline top" } }],
        main: ["hero-1"],
        bottom: ["shell-build-meta"],
      },
    });

    const result = buildDemoRenderSchema(schema, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v9",
      widgetEmbedHtml: "",
    });

    assert.equal(typeof result.layout?.top[0], "object");
  });

  it("injects shell blocks and promotes hero when schema layout omits shell placement", () => {
    const schema = buildSchema({
      layout: {
        top: ["faq-1"],
        main: ["faq-1"],
        bottom: ["hero-1"],
      },
    });

    const result = buildDemoRenderSchema(schema, {
      pageTitleFallback: "Fallback",
      currentVersionLabel: "v10",
      widgetEmbedHtml: "",
    });

    assert.deepEqual(result.layout, {
      top: ["shell-page-header"],
      main: ["hero-1", "faq-1"],
      bottom: ["shell-widget-embed", "shell-build-meta"],
    });
  });
});
