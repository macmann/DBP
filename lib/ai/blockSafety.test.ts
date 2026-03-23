import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  formatBlockSafetyViolations,
  inspectGeneratedPageBlockSafety,
  sanitizeGeneratedPageBlockSafety,
} from "@/lib/ai/blockSafety";
import type { GeneratedBlock, GeneratedPageSchema } from "@/lib/ai/schema";

type MaliciousFixture = {
  name: string;
  block: GeneratedBlock;
  expectedViolationCodes: string[];
};

const maliciousFixtures = JSON.parse(
  readFileSync(new URL("./fixtures/block-safety-malicious.json", import.meta.url), "utf8"),
) as MaliciousFixture[];

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

  it("requires root-relative urls for action/formAction fields", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "form-1",
          type: "cta",
          props: {
            action: "https://evil.example.com/collect",
            formAction: "/submit",
          },
        },
      ],
      sections: [],
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);

    assert.deepEqual(sanitized.blocks?.[0]?.props, {
      formAction: "/submit",
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

  it("strips non-script inline HTML payloads from non-allowlisted block types", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          props: {
            html: "<p>safe markup but still raw HTML</p>",
          },
        },
      ],
      sections: [],
    });

    const result = inspectGeneratedPageBlockSafety(schema);

    assert.equal((result.schema.blocks?.[0]?.props as Record<string, unknown>).html, "");
    assert.deepEqual(result.violations.map((violation) => violation.code), ["unsafe_html_payload"]);
  });

  it("neutralizes dangerous HTML-like payload strings on embed-like blocks", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "widget-1",
          type: "widgetEmbed",
          props: {
            payload: {
              snippet: "<img src=x onerror=alert(1)>",
            },
            config: {
              sourceUrl: "javascript:alert('pwned')",
            },
          },
        },
      ],
      sections: [],
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);
    const widgetProps = sanitized.blocks?.[0]?.props as Record<string, unknown>;
    assert.equal(((widgetProps.payload as Record<string, unknown>).snippet as string) ?? "", "");
    assert.equal((widgetProps.config as Record<string, unknown>).sourceUrl, undefined);
  });

  it("permits dangerous HTML only for explicitly-allowed block types", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "widget-1",
          type: "widgetEmbed",
          props: {
            html: "<script src='https://safe-widget.example/script.js'></script>",
          },
        },
      ],
      sections: [],
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema, {
      allowedInlineHtmlBlockTypes: ["widgetEmbed"],
    });

    assert.equal(
      (sanitized.blocks?.[0]?.props as Record<string, unknown>).html,
      "<script src='https://safe-widget.example/script.js'></script>",
    );
  });

  it("does not treat non-embed widget block types as implicitly denied", () => {
    const schema = createFixture({
      blocks: [
        {
          id: "widget-card-1",
          type: "widgetCard",
          props: {
            title: "A safe widget card",
          },
        },
      ],
      sections: [],
    });

    const result = inspectGeneratedPageBlockSafety(schema);
    assert.equal(result.schema.blocks?.length, 1);
    assert.equal(result.violations.length, 0);
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
        main: ["inline-embed", "hero-1"],
        bottom: ["widget-shell"],
      },
    });

    const sanitized = sanitizeGeneratedPageBlockSafety(schema);

    assert.deepEqual(
      (sanitized.blocks ?? []).map((block) => block.id),
      ["hero-1"],
    );
    assert.deepEqual(sanitized.layout?.top, ["hero-1"]);
    assert.deepEqual(sanitized.layout?.main, ["hero-1"]);
    assert.deepEqual(sanitized.layout?.bottom, []);
  });

  it("tracks actionable violations for malicious fixture payloads", () => {
    for (const fixture of maliciousFixtures) {
      const result = inspectGeneratedPageBlockSafety(
        createFixture({
          blocks: [fixture.block],
          sections: [],
        }),
      );

      assert.deepEqual(
        result.violations.map((violation) => violation.code),
        fixture.expectedViolationCodes,
        `fixture failed: ${fixture.name}`,
      );
    }
  });

  it("formats policy violations into actionable error text", () => {
    const result = inspectGeneratedPageBlockSafety(
      createFixture({
        blocks: [
          {
            id: "hero-1",
            type: "hero",
            props: {
              href: "javascript:alert(1)",
            },
          },
        ],
      }),
    );

    const message = formatBlockSafetyViolations(result.violations);
    assert.match(message, /disallowed_url_protocol/);
    assert.match(message, /blocks\.hero-1\.props\.href/);
  });
});
