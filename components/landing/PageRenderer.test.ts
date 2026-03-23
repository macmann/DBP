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
