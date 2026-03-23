import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
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

  it("renders unknown block fallback when type is not registered", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "unknown-1",
            type: "not-registered",
            props: {
              heading: "Should not render",
            },
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
