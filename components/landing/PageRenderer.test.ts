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
});
