import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
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
        top: [{ id: "shell-page-header", type: "pageHeader" }],
        main: ["hero-1", { id: "promo-inline", type: "cta", props: { heading: "Promo" } }],
        bottom: [{ id: "shell-widget-embed", type: "widgetEmbed" }, "shell-build-meta"],
      },
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
});
