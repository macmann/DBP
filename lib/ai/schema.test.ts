import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import {
  CURRENT_GENERATED_SCHEMA_VERSION,
  sanitizeGeneratedPageSchema,
  validateGeneratedPageSchema,
} from "./schema";
import { buildPageGenerationPrompts } from "./promptBuilder";
import legacySavedVersionFixture from "./fixtures/saved-version-v1.json";
import currentSavedVersionFixture from "./fixtures/saved-version-v2.json";

const validFixture = {
  pageTitle: "Acme Analytics",
  summary: "Analytics for modern teams",
  pageHeaderAlignment: "left",
  theme: {
    primaryColor: "#111827",
    accentColor: "#3B82F6",
    fontFamily: "Inter, sans-serif",
    spacing: "comfortable",
    radius: "md",
  },
  seo: {
    title: "Acme Analytics | Dashboard Software",
    description: "Track business metrics in one place.",
    canonicalUrl: "https://example.com/analytics",
    ogImageAssetId: "asset-og-1",
  },
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      props: {
        heading: "Know your numbers",
        body: "A simple analytics platform.",
        cta: {
          label: "Start free",
          href: "/signup",
        },
      },
    },
  ],
} as const;

describe("validateGeneratedPageSchema", () => {
  it("accepts a valid payload with theme and seo", () => {
    const result = validateGeneratedPageSchema(validFixture);

    assert.equal(result.success, true);
  });

  it("fails when theme is missing", () => {
    const { theme: _theme, ...payload } = validFixture;
    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("theme must be an object."));
  });

  it("fails when seo is missing", () => {
    const { seo: _seo, ...payload } = validFixture;
    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("seo must be an object."));
  });

  it("fails when theme has unsupported keys", () => {
    const payload = {
      ...validFixture,
      theme: {
        ...validFixture.theme,
        unexpected: "value",
      },
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("theme contains unsupported keys."));
  });

  it("fails when optional theme/seo strings are empty", () => {
    const payload = {
      ...validFixture,
      theme: {
        ...validFixture.theme,
        spacing: "   ",
      },
      seo: {
        ...validFixture.seo,
        ogImageAssetId: "   ",
      },
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("theme.spacing must be a non-empty string when provided."));
    assert.ok(
      result.errors.includes("seo.ogImageAssetId must be a non-empty string when provided."),
    );
  });

  it("fails when pageHeaderAlignment is invalid", () => {
    const payload = {
      ...validFixture,
      pageHeaderAlignment: "right",
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(
      result.errors.includes(
        "pageHeaderAlignment must be either 'left' or 'center' when provided.",
      ),
    );
  });

  it("fails when CTA href is not URL or root-relative path", () => {
    const payload = {
      ...validFixture,
      blocks: [
        {
          ...validFixture.blocks[0],
          props: {
            cta: {
              label: "Start free",
              href: "not a url",
            },
          },
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(
      result.errors.includes(
        "blocks[0].cta.href must be an absolute http(s) URL or root-relative path.",
      ),
    );
  });

  it("fails when SEO URL fields are invalid", () => {
    const payload = {
      ...validFixture,
      seo: {
        ...validFixture.seo,
        canonicalUrl: "ftp://example.com/not-allowed",
      },
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("seo.canonicalUrl must be a valid http(s) URL."));
  });

  it("fails when payload is not an object", () => {
    const result = validateGeneratedPageSchema("not-an-object");

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("Output must be a JSON object."));
  });

  it("fails when SEO contains unsupported keys", () => {
    const payload = {
      ...validFixture,
      seo: {
        ...validFixture.seo,
        robots: "index,follow",
      },
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("seo contains unsupported keys."));
  });

  it("fails when SEO title and description exceed max lengths", () => {
    const payload = {
      ...validFixture,
      seo: {
        ...validFixture.seo,
        title: "T".repeat(71),
        description: "D".repeat(161),
      },
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("seo.title must be at most 70 characters."));
    assert.ok(result.errors.includes("seo.description must be at most 160 characters."));
  });

  it("supports optional per-block validators", () => {
    const payload = {
      ...validFixture,
      blocks: [
        {
          ...validFixture.blocks[0],
          props: {
            eyebrow: 123,
          },
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload, {
      blockValidators: {
        hero: (props) => {
          if (typeof props?.eyebrow !== "string") {
            return ["props.eyebrow must be a string when provided."];
          }
          return [];
        },
      },
    });

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("blocks[0].props.eyebrow must be a string when provided."));
  });

  it("fails when CTA label is blank", () => {
    const payload = {
      ...validFixture,
      blocks: [
        {
          id: "hero-1",
          type: "hero",
          cta: {
            label: "   ",
            href: "/signup",
          },
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("blocks[0].cta.label must be a non-empty string."));
  });

  it("allows unknown block types with baseline validation", () => {
    const payload = {
      ...validFixture,
      blocks: [
        {
          id: "hero-1",
          type: "video" as unknown as string,
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, true);
  });

  it("accepts minimal block shape (id + type) without section-specific fields", () => {
    const payload = {
      ...validFixture,
      blocks: [
        {
          id: "only-required-fields",
          type: "customBlock",
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);
    assert.equal(result.success, true);
  });

  it("accepts dynamic blocks in layout regions when block IDs are referenced", () => {
    const payload = {
      ...validFixture,
      blocks: [
        ...validFixture.blocks,
        {
          id: "custom-social-proof",
          type: "socialProofWall",
          props: {
            heading: "Loved by teams",
          },
        },
      ],
      layout: {
        top: ["shell-page-header"],
        main: ["hero-1", "custom-social-proof"],
        bottom: ["shell-build-meta"],
      },
    };

    const result = validateGeneratedPageSchema(payload);
    assert.equal(result.success, true);
  });

  it("accepts layout regions with block ID references", () => {
    const payload = {
      ...validFixture,
      layout: {
        top: ["shell-page-header"],
        main: ["hero-1"],
        bottom: ["shell-build-meta"],
      },
    };

    const result = validateGeneratedPageSchema(payload);
    assert.equal(result.success, true);
  });

  it("fails when layout has invalid region entries", () => {
    const payload = {
      ...validFixture,
      layout: {
        top: [""],
        main: [""],
        bottom: ["hero/main"],
      },
    };

    const result = validateGeneratedPageSchema(payload);
    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("layout.top[0] must be a non-empty string reference."));
    assert.ok(result.errors.includes("layout.main[0] must be a non-empty string reference."));
    assert.ok(
      result.errors.includes(
        "layout.bottom[0] must be URL-safe (letters, numbers, '-' or '_').",
      ),
    );
  });

  it("sanitizes common model formatting issues", () => {
    const payload = {
      ...validFixture,
      seo: {
        ...validFixture.seo,
        title: `  ${"T".repeat(90)}  `,
        description: ` ${"D".repeat(180)} `,
      },
      pageHeaderAlignment: "  CENTER ",
      sections: [
        {
          id: "hero-1",
          type: "hero",
          cta: {
            label: "Start free",
            href: "www.example.com/pricing",
          },
        },
        {
          id: "cta-2",
          type: "hero",
          cta: {
            label: "Contact",
            href: "contact",
          },
        },
      ],
    };

    const sanitized = sanitizeGeneratedPageSchema(payload);
    const result = validateGeneratedPageSchema(sanitized);

    assert.equal(result.success, true);
    if (!result.success) {
      throw new Error("Expected validation success");
    }
    assert.equal(result.data.pageHeaderAlignment, "center");
    assert.equal("sections" in result.data, false);
  });

  it("maps legacy sections arrays into blocks during sanitization", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          id: "legacy-hero",
          type: "hero",
          layoutVariant: "split",
          heading: "Legacy heading",
          body: "Legacy body",
        },
      ],
    };
    delete (payload as { blocks?: unknown }).blocks;

    const sanitized = sanitizeGeneratedPageSchema(payload);
    const result = validateGeneratedPageSchema(sanitized);

    assert.equal(result.success, true);
    if (!result.success) {
      throw new Error("Expected validation success");
    }

    assert.deepEqual(result.data.blocks?.[0], {
      id: "legacy-hero",
      type: "hero",
      variant: "split",
      props: {
        heading: "Legacy heading",
        body: "Legacy body",
      },
    });
    assert.equal("sections" in result.data, false);
  });

  it("maps legacy sections with custom types into blocks without enum restrictions", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          id: "legacy-social-proof",
          type: "socialProofWall",
          heading: "Legacy social proof",
        },
      ],
    };
    delete (payload as { blocks?: unknown }).blocks;

    const sanitized = sanitizeGeneratedPageSchema(payload);
    const result = validateGeneratedPageSchema(sanitized);

    assert.equal(result.success, true);
    if (!result.success) {
      throw new Error("Expected validation success");
    }

    assert.deepEqual(result.data.blocks?.[0], {
      id: "legacy-social-proof",
      type: "socialProofWall",
      props: {
        heading: "Legacy social proof",
      },
    });
  });

  it("fails when legacy sections omit required baseline block shape", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          id: "missing-type",
        },
      ],
    };
    delete (payload as { blocks?: unknown }).blocks;

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("blocks[0].type must be a non-empty string."));
  });

  it("fails when block url-safe fields include unsupported characters", () => {
    const payload = {
      ...validFixture,
      blocks: [
        {
          id: "hero 1",
          type: "hero/main",
          variant: "split view",
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);
    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(
      result.errors.includes("blocks[0].id must be URL-safe (letters, numbers, '-' or '_')."),
    );
    assert.ok(
      result.errors.includes("blocks[0].type must be URL-safe (letters, numbers, '-' or '_')."),
    );
    assert.ok(
      result.errors.includes(
        "blocks[0].variant must be URL-safe (letters, numbers, '-' or '_').",
      ),
    );
  });

  it("migrates legacy saved schema fixtures at runtime", () => {
    const result = validateGeneratedPageSchema(legacySavedVersionFixture);
    assert.equal(result.success, true);
    if (!result.success) {
      throw new Error("Expected validation success");
    }

    assert.equal(result.data.schemaVersion, CURRENT_GENERATED_SCHEMA_VERSION);
    assert.ok(Array.isArray(result.data.blocks));
    assert.equal(result.data.blocks?.length, legacySavedVersionFixture.sections.length);
    assert.deepEqual(
      result.data.layout?.main,
      legacySavedVersionFixture.sections.map((section) => section.id),
    );
  });

  it("keeps v2 saved schema fixtures readable in demo/publish runtime", () => {
    const result = validateGeneratedPageSchema(currentSavedVersionFixture);
    assert.equal(result.success, true);
    if (!result.success) {
      throw new Error("Expected validation success");
    }

    assert.equal(result.data.schemaVersion, CURRENT_GENERATED_SCHEMA_VERSION);
    assert.deepEqual(result.data.layout?.main, ["hero-modern"]);
  });
});

describe("buildPageGenerationPrompts", () => {
  it("mentions required keys and block/layout contract requirements", () => {
    const prompt = buildPageGenerationPrompts({
      pagePrompt: "Create a landing page",
      referenceLinks: [],
      assets: [],
      allowedBlockTypes: ["hero", "features", "cta"],
      toneBrandingHints: [],
      layoutRegions: ["top", "main", "bottom"],
    });

    assert.match(
      prompt.systemPrompt,
      /theme, seo, blocks, and layout are required and must be valid objects\/array\./,
    );
    assert.match(prompt.systemPrompt, /pageHeaderAlignment \(optional\)/);
    assert.match(prompt.systemPrompt, /seo.title must be 70 characters or fewer\./);
    assert.match(prompt.systemPrompt, /seo.description must be 160 characters or fewer\./);
    assert.match(
      prompt.systemPrompt,
      /Every blocks\[\]\.props\.cta\.href must be either an absolute http\(s\) URL or a root-relative path that starts with '\/'\./,
    );
    assert.match(
      prompt.systemPrompt,
      /Each blocks\[\] entry must include id and type\. variant and props are optional\./,
    );
    assert.match(
      prompt.systemPrompt,
      /assign relevant blocks\[\]\.props\.mediaAssetIds for visual blocks \(hero, imageText, gallery, logoStrip, testimonial\)\./,
    );
    assert.match(
      prompt.systemPrompt,
      /demo renders real images instead of fallback placeholders\./,
    );
    assert.match(
      prompt.systemPrompt,
      /must follow the page prompt and not default to a fixed boilerplate sequence\./,
    );
    assert.match(
      prompt.systemPrompt,
      /layout\.top, layout\.main, and layout\.bottom must be arrays of block IDs that reference existing blocks\[\]\.id values\./,
    );
    assert.match(
      prompt.systemPrompt,
      /The response contract is block\/layout based only: blocks\[\] define content units and layout maps placement by block ID\./,
    );
    assert.match(
      prompt.systemPrompt,
      /Preserve deterministic JSON constraints while increasing semantic diversity: vary composition and copy strategy without inventing non-schema keys\./,
    );
    assert.match(prompt.userPrompt, /required keys: pageTitle, theme, seo, blocks, layout/);
    assert.match(
      prompt.userPrompt,
      /"pageHeaderAlignment\?": "left \| center \/\/ controls top page header alignment"/,
    );
    assert.match(
      prompt.userPrompt,
      /"blocks": \[\n\n    \{\n\n      "id": "string \/\/ stable block id"/,
    );
    assert.match(
      prompt.userPrompt,
      /"type": "string \/\/ required URL-safe token, usually derived from the page prompt"/,
    );
    assert.match(
      prompt.userPrompt,
      /"variant\?": "string \/\/ optional layout\/style variant token"/,
    );
    assert.match(prompt.userPrompt, /"props\?": "object \/\/ optional block payload/);
    assert.match(prompt.userPrompt, /"layout": \{/);
    assert.match(prompt.userPrompt, /"top": "string\[\] \/\/ block ids placed above main content"/);
    assert.match(prompt.userPrompt, /"main": "string\[\] \/\/ block ids for primary narrative flow"/);
    assert.match(prompt.userPrompt, /"bottom": "string\[\] \/\/ block ids for footer-adjacent content"/);
    assert.match(
      prompt.userPrompt,
      /Ensure every layout ID exists in blocks\[\]\.id and preserve block ID uniqueness\./,
    );
    assert.match(prompt.userPrompt, /Use only the keys above\. Block type names should be URL-safe and prompt-driven\./);
    assert.match(prompt.userPrompt, /Do not output any text before or after the JSON object\./);
    assert.match(prompt.userPrompt, /Prompt-suggested block types:\nhero, features, cta/);
  });
});
