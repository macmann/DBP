import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { GeneratedPageSchema } from "@/lib/ai/schema";
import type { AssetResolver } from "@/components/landing/types";
import { PageRenderer } from "@/components/landing/PageRenderer";

const resolveAsset: AssetResolver = () => null;

function buildPage(blocks: GeneratedPageSchema["blocks"]): GeneratedPageSchema {
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
  };
}

describe("PageRenderer", () => {
  it("renders a known block type via registry", () => {
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
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /Known block heading/);
  });

  it("renders another registered block type via registry", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
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

    assert.match(markup, /Call to action heading/);
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

  it("renders malformed block fallback when block shape is invalid", () => {
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

  it("renders malformed block fallback when props are not an object", () => {
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

  it("renders malformed block fallback when props are invalid", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "hero-malformed",
            type: "hero",
            props: {
              heading: 123,
            } as unknown as Record<string, unknown>,
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /could not be rendered due to malformed props/);
    assert.match(markup, /hero-malformed/);
  });

  it("renders blocks by layout regions when layout is provided", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: {
          ...buildPage([
            {
              id: "hero-1",
              type: "hero",
              props: { heading: "Hero in main" },
            },
            {
              id: "footer-1",
              type: "footer",
              props: { heading: "Footer in bottom" },
            },
          ]),
          layout: {
            top: ["unknown-inline"],
            main: ["hero-1"],
            bottom: ["footer-1"],
          },
        },
        resolveAsset,
      }),
    );

    assert.match(markup, /data-layout-region=\"top\"/);
    assert.match(markup, /data-layout-region=\"main\"/);
    assert.match(markup, /data-layout-region=\"bottom\"/);
    assert.match(markup, /Hero in main/);
    assert.match(markup, /Footer in bottom/);
  });

  it("renders unknown fallback for unresolved layout block references", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: {
          ...buildPage([
            {
              id: "hero-1",
              type: "hero",
              props: { heading: "Hero in main" },
            },
          ]),
          layout: {
            top: [],
            main: ["hero-1", "missing-block-id"],
            bottom: [],
          },
        },
        resolveAsset,
      }),
    );

    assert.match(markup, /Unsupported block type/);
    assert.match(markup, /missing-block-ref/);
  });

  it("falls back to a legacy main-only layout when layout is absent", () => {
    const markup = renderToStaticMarkup(
      createElement(PageRenderer, {
        page: buildPage([
          {
            id: "hero-legacy",
            type: "hero",
            props: { heading: "Legacy hero in main region" },
          },
        ]),
        resolveAsset,
      }),
    );

    assert.match(markup, /data-layout-region=\"top\"/);
    assert.match(markup, /data-layout-region=\"main\"/);
    assert.match(markup, /data-layout-region=\"bottom\"/);
    assert.match(markup, /Legacy hero in main region/);
  });
});
