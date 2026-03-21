import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import {
  ALLOWED_SECTION_TYPES,
  sanitizeGeneratedPageSchema,
  validateGeneratedPageSchema,
} from "./schema";
import { buildPageGenerationPrompts } from "./promptBuilder";

const validFixture = {
  pageTitle: "Acme Analytics",
  summary: "Analytics for modern teams",
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
  sections: [
    {
      id: "hero-1",
      type: "hero",
      heading: "Know your numbers",
      body: "A simple analytics platform.",
      cta: {
        label: "Start free",
        href: "/signup",
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

  it("fails when CTA href is not URL or root-relative path", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          ...validFixture.sections[0],
          cta: {
            label: "Start free",
            href: "not a url",
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
        "sections[0].cta.href must be an absolute http(s) URL or root-relative path.",
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

  it("fails when section mediaAssetIds contains non-string values", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          ...validFixture.sections[0],
          mediaAssetIds: ["asset-1", 123],
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error("Expected validation failure");
    }
    assert.ok(result.errors.includes("sections[0].mediaAssetIds must be an array of strings."));
  });

  it("fails when CTA label is blank", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          ...validFixture.sections[0],
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
    assert.ok(result.errors.includes("sections[0].cta.label must be a non-empty string."));
  });

  it("fails when a section type is invalid", () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          ...validFixture.sections[0],
          type: "video" as unknown,
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
        `sections[0].type must be one of: ${ALLOWED_SECTION_TYPES.join(", ")}.`,
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
      sections: [
        {
          ...validFixture.sections[0],
          cta: {
            label: "Start free",
            href: "www.example.com/pricing",
          },
        },
        {
          ...validFixture.sections[0],
          id: "cta-2",
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
  });
});

describe("buildPageGenerationPrompts", () => {
  it("mentions required keys and allowed section types", () => {
    const prompt = buildPageGenerationPrompts({
      pagePrompt: "Create a landing page",
      referenceLinks: [],
      assets: [],
      allowedSections: ["hero", "features", "cta"],
      toneBrandingHints: [],
    });

    assert.match(
      prompt.systemPrompt,
      /theme, seo, and sections are required and must be valid objects\/array\./,
    );
    assert.match(prompt.systemPrompt, /seo.title must be 70 characters or fewer\./);
    assert.match(prompt.systemPrompt, /seo.description must be 160 characters or fewer\./);
    assert.match(
      prompt.systemPrompt,
      /Every sections\[\]\.cta\.href must be either an absolute http\(s\) URL or a root-relative path that starts with '\/'\./,
    );
    assert.match(
      prompt.systemPrompt,
      /assign relevant section\.mediaAssetIds for visual sections \(hero, imageText, gallery, logoStrip, testimonial\)\./,
    );
    assert.match(
      prompt.systemPrompt,
      /demo renders real images instead of fallback placeholders\./,
    );
    assert.match(prompt.userPrompt, /required keys: pageTitle, theme, seo, sections/);
    assert.match(prompt.userPrompt, /Do not output any text before or after the JSON object\./);
    assert.match(prompt.userPrompt, /Allowed sections:\nhero, features, cta/);
  });
});
