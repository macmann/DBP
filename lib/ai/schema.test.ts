import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import { ALLOWED_SECTION_TYPES, validateGeneratedPageSchema } from './schema';
import { buildPageGenerationPrompts } from './promptBuilder';

const validFixture = {
  pageTitle: 'Acme Analytics',
  summary: 'Analytics for modern teams',
  theme: {
    primaryColor: '#111827',
    accentColor: '#3B82F6',
    fontFamily: 'Inter, sans-serif',
    spacing: 'comfortable',
    radius: 'md',
  },
  seo: {
    title: 'Acme Analytics | Dashboard Software',
    description: 'Track business metrics in one place.',
    canonicalUrl: 'https://example.com/analytics',
    ogImageAssetId: 'asset-og-1',
  },
  sections: [
    {
      id: 'hero-1',
      type: 'hero',
      heading: 'Know your numbers',
      body: 'A simple analytics platform.',
      cta: {
        label: 'Start free',
        href: '/signup',
      },
    },
  ],
} as const;

describe('validateGeneratedPageSchema', () => {
  it('accepts a valid payload with theme and seo', () => {
    const result = validateGeneratedPageSchema(validFixture);

    assert.equal(result.success, true);
  });

  it('fails when theme is missing', () => {
    const { theme: _theme, ...payload } = validFixture;
    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error('Expected validation failure');
    }
    assert.ok(result.errors.includes('theme must be an object.'));
  });

  it('fails when seo is missing', () => {
    const { seo: _seo, ...payload } = validFixture;
    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error('Expected validation failure');
    }
    assert.ok(result.errors.includes('seo must be an object.'));
  });

  it('fails when SEO URL fields are invalid', () => {
    const payload = {
      ...validFixture,
      seo: {
        ...validFixture.seo,
        canonicalUrl: 'ftp://example.com/not-allowed',
      },
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error('Expected validation failure');
    }
    assert.ok(result.errors.includes('seo.canonicalUrl must be a valid http(s) URL.'));
  });

  it('fails when a section type is invalid', () => {
    const payload = {
      ...validFixture,
      sections: [
        {
          ...validFixture.sections[0],
          type: 'video' as unknown,
        },
      ],
    };

    const result = validateGeneratedPageSchema(payload);

    assert.equal(result.success, false);
    if (result.success) {
      throw new Error('Expected validation failure');
    }
    assert.ok(
      result.errors.includes(
        `sections[0].type must be one of: ${ALLOWED_SECTION_TYPES.join(', ')}.`,
      ),
    );
  });
});

describe('buildPageGenerationPrompts', () => {
  it('mentions required keys and allowed section types', () => {
    const prompt = buildPageGenerationPrompts({
      pagePrompt: 'Create a landing page',
      referenceLinks: [],
      assets: [],
      allowedSections: ['hero', 'features', 'cta'],
      toneBrandingHints: [],
    });

    assert.match(prompt.systemPrompt, /Always include theme, seo, and sections\./);
    assert.match(prompt.userPrompt, /required keys: pageTitle, theme, seo, sections/);
    assert.match(prompt.userPrompt, /Allowed sections:\nhero, features, cta/);
  });
});
