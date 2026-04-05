import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { registerBlock } from "@/components/landing/blockRegistry";
import { PageRenderer } from "@/components/landing/PageRenderer";

const resolveAsset: AssetResolver = () => null;

function buildPage(
  blocks: GeneratedPageSchema["blocks"],
  layout?: GeneratedPageSchema["layout"],
): GeneratedPageSchema {
  return {
    pageTitle: "Test page",
    theme: {
      primaryColor: "#111827",
      accentColor: "#3B82F6",
      fontFamily: "Inter",
    },
    seo: {
      title: "Title",
      description: "Description",
    },
    blocks,
    sections: blocks ?? [],
    ...(layout ? { layout } : {}),
  };
}

describe("PageRenderer", () => {
  it("supports runtime registration of new block renderers", () => {
    registerBlock("runtimePlugin", ({ block }) =>
      createElement("section", null, `Runtime plugin rendered: ${block.id}`),
    );

    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "runtime-1",
            type: "runtimePlugin",
            props: {},
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /Runtime plugin rendered: runtime-1/);
  });

  it("renders known block types via registry lookup", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "hero-1",
            type: "hero",
            props: {
              heading: "Known block heading",
            },
          },
          {
            id: "cta-1",
            type: "cta",
            props: {
              heading: "Call to action heading",
            },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /Known block heading/);
    assert.match(markup, /Call to action heading/);
  });

  it("maps common alias block types to supported renderers", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "feature-grid-1",
            type: "feature-grid",
            props: {
              heading: "Alias features heading",
              items: [{ title: "Feature A" }],
            },
          },
          {
            id: "testimonials-1",
            type: "testimonials",
            props: {
              heading: "Alias testimonials heading",
              items: [{ quote: "Great product", name: "Casey" }],
            },
          },
          {
            id: "nav-1",
            type: "navbar",
            props: {
              pageTitle: "Alias navbar heading",
            },
          },
          {
            id: "cta-form-1",
            type: "cta-form",
            props: {
              heading: "Alias cta heading",
            },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /Alias features heading/);
    assert.match(markup, /Alias testimonials heading/);
    assert.match(markup, /Alias navbar heading/);
    assert.match(markup, /Alias cta heading/);
    assert.doesNotMatch(markup, /Unsupported block type/);
  });


  it("ignores layout regions when v2 rendering flag is disabled", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage(
          [
            {
              id: "hero-1",
              type: "hero",
              props: {
                heading: "Hero heading",
              },
            },
            {
              id: "cta-1",
              type: "cta",
              props: {
                heading: "CTA heading",
              },
            },
          ],
          {
            top: ["cta-1"],
            main: ["hero-1"],
            bottom: [],
          },
        ),
        resolveAsset,
        enableV2LayoutRendering: false,
      }),
    );

    assert.ok(markup.indexOf("Hero heading") < markup.indexOf("CTA heading"));
  });

  it("renders regions in top/main/bottom layout order when layout is provided", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage(
          [
            {
              id: "hero-1",
              type: "hero",
              props: {
                heading: "Hero heading",
              },
            },
            {
              id: "cta-1",
              type: "cta",
              props: {
                heading: "CTA heading",
              },
            },
          ],
          {
            top: ["cta-1"],
            main: ["hero-1"],
            bottom: [],
          },
        ),
        resolveAsset,
      }),
    );

    assert.ok(markup.indexOf("CTA heading") < markup.indexOf("Hero heading"));
  });

  it("renders inline layout block refs through the same renderer", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage(
          [
            {
              id: "hero-1",
              type: "hero",
              props: {
                heading: "Hero heading",
              },
            },
          ],
          {
            top: [{ id: "inline-cta", type: "cta", props: { heading: "Inline CTA heading" } }],
            main: ["hero-1"],
            bottom: [],
          },
        ),
        resolveAsset,
      }),
    );

    assert.ok(markup.indexOf("Inline CTA heading") < markup.indexOf("Hero heading"));
  });

  it("falls back to block order when layout is absent", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "hero-1",
            type: "hero",
            props: {
              heading: "Hero heading",
            },
          },
          {
            id: "cta-1",
            type: "cta",
            props: {
              heading: "CTA heading",
            },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.ok(markup.indexOf("Hero heading") < markup.indexOf("CTA heading"));
  });

  it("falls back to block order when layout has no renderable entries", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage(
          [
            {
              id: "hero-1",
              type: "hero",
              props: {
                heading: "Hero heading",
              },
            },
            {
              id: "cta-1",
              type: "cta",
              props: {
                heading: "CTA heading",
              },
            },
          ],
          {
            top: ["   "],
            main: [],
            bottom: [""],
          },
        ),
        resolveAsset,
      }),
    );

    assert.ok(markup.indexOf("Hero heading") < markup.indexOf("CTA heading"));
  });

  it("renders missing layout reference fallback when layout points to unknown block id", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage(
          [
            {
              id: "hero-1",
              type: "hero",
              props: {
                heading: "Hero heading",
              },
            },
          ],
          {
            top: ["missing-1"],
            main: ["hero-1"],
            bottom: [],
          },
        ),
        resolveAsset,
      }),
    );

    assert.match(markup, /Layout references missing block ID/);
    assert.match(markup, /missing-1/);
    assert.match(markup, /Hero heading/);
  });

  it("renders a generic custom block for unknown types with valid props", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "unknown-1",
            type: "not-registered",
            props: {
              heading: "Custom block heading",
              body: "Custom block body",
              items: [{ title: "Item one", body: "Item one body" }],
            },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /Custom block heading/);
    assert.match(markup, /Custom block body/);
    assert.match(markup, /Item one/);
    assert.match(markup, /Custom block/);
    assert.match(markup, /not-registered/);
    assert.doesNotMatch(markup, /Unsupported block type/);
  });

  it("renders unknown block placeholder when unknown type has malformed props", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "unknown-1",
            type: "not-registered",
            props: "bad-props" as unknown as Record<string, unknown>,
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /Unsupported block type/);
    assert.match(markup, /not-registered/);
  });

  it("renders malformed block fallback when block id is missing", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "",
            type: "hero",
            props: {
              heading: "Missing id",
            },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /could not be rendered due to malformed props/);
    assert.match(markup, /unknown/);
  });

  it("renders malformed block fallback when type is missing", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "missing-type",
            type: "" as unknown as string,
            props: {
              heading: "Missing type",
            },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /could not be rendered due to malformed props/);
    assert.match(markup, /missing-type/);
  });

  it("renders malformed block fallback when props payload is invalid", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "hero-bad-props",
            type: "hero",
            props: "invalid" as unknown as Record<string, unknown>,
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /could not be rendered due to malformed props/);
    assert.match(markup, /hero-bad-props/);
  });
});
