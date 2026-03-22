import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import { sanitizeGeneratedPageBlockSafety } from "@/lib/ai/blockSafety";
import type { GeneratedPageSchema } from "@/lib/ai/schema";

function createFixture(overrides?: Partial<GeneratedPageSchema>): GeneratedPageSchema {
  return {
    pageTitle: "Acme",
    theme: {
      primaryColor: "#111827",
      accentColor: "#3B82F6",
      fontFamily: "Inter",
    },
    seo: {
      title: "Acme",
      description: "Desc",
    },
    blocks: [
      {
        id: "hero-1",
        type: "hero",
        props: {
          cta: {
            href: "https://example.com",
          },
        },
      },
    ],
    sections: [
      {
        id: "hero-1",
        type: "hero",
      },
    ],
    ...overrides,
  };
}

describe("sanitizeGeneratedPageBlockSafety", () => {
  it("removes javascript and data URL payloads from known URL keys", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            href: " javascript:alert(1) ",
            src: "data:text/html;base64,abcd",
            nested: {
              url: "https://safe.example.com/path",
            },
          },
        },
      ],
      sections: [],
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);
    const heroBlock = sanitized.blocks?.[0];
    assert.ok(heroBlock);

    assert.deepEqual(heroBlock.props, {
      nested: {
        url: "https://safe.example.com/path",
      },
    });
  });

  it("keeps root-relative and https URLs while dropping protocol-relative bypasses", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            href: "/pricing",
            src: "//evil.example.com/steal.js",
            link: "http://safe.example.com",
          },
        },
      ],
      sections: [],
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);

    assert.deepEqual(sanitized.blocks?.[0]?.props, {
      href: "/pricing",
      link: "http://safe.example.com",
    });
  });

  it("strips dangerous inline HTML/script payloads when HTML is not explicitly allowed", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            html: "<div onclick=\"alert(1)\"><script>alert(1)</script></div>",
          },
        },
      ],
      sections: [],
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);

    assert.equal((sanitized.blocks?.[0]?.props as Record<string, unknown>).html, "");
  });

  it("drops denied embed-like blocks and removes matching layout references", () => {
    const schema = createFixture({
      blocks: [
        { id: "embed-1", type: "htmlEmbed", props: { src: "https://evil.example.com" } },
        { id: "hero-1", type: "hero" },
      ],
      sections: [],
      layout: {
        top: ["embed-1", "hero-1"],
        main: [{ id: "inline-embed", type: "iframe" }, "hero-1"],
        bottom: [{ id: "widget-shell", type: "widgetEmbed" }],
      },
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);

    assert.deepEqual(
      (sanitized.blocks ?? []).map((block) => block.id),
      ["hero-1"],
    );
    assert.deepEqual(sanitized.layout?.top, ["hero-1"]);
    assert.deepEqual(sanitized.layout?.main, ["hero-1"]);
    assert.equal((sanitized.layout?.bottom[0] as { type: string }).type, "widgetEmbed");
  });
});
