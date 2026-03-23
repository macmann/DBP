# Block safety prop policy for plugin authors

This document describes what generated block props are allowed through the server safety pass (`lib/ai/blockSafety.ts`) and what patterns will be sanitized or blocked.

## Why this exists

Generated content can include malicious payloads (for example `javascript:` URLs, inline handlers, or raw script embeds). The block safety pass runs after schema parse/validation and before persistence so unsafe prompt output is never stored or rendered.

## URL protocol allowlist rules

URL-like props are sanitized with an allowlist:

- **Allowed**
  - `https://...`
  - `http://...`
  - Root-relative paths like `/pricing`
- **Blocked/removed**
  - `javascript:...`
  - `data:...`
  - `vbscript:...`
  - Protocol-relative URLs like `//evil.example.com/...`

Special case for form actions:

- `action` and `formAction` must be **root-relative only** (for example `/submit`).
- Absolute URLs are removed for those keys.

### URL-sensitive prop names

The strict key allowlist includes:

- `href`
- `src`
- `url`
- `link`
- `poster`
- `action`
- `formAction`

Additionally, keys that look URL-like (`*url`, `*href`, `*src`) are checked for unsafe protocols.

## Script/event-handler stripping rules

### Event handlers

Any prop key matching `on*` (for example `onClick`, `onLoad`, `onMouseOver`) is removed from generated payloads.

### Raw HTML/script payloads

The following HTML-ish keys are considered dangerous unless explicitly allowlisted by block type:

- `html`, `embedHtml`, `innerHtml`, `markup`, `script`, `code`, `snippet`, `srcDoc`, `iframe`, `payload`

Payloads are removed/emptied when they contain dangerous patterns such as:

- `<script ...>` tags
- `<iframe>`, `<object>`, `<embed>`, `<link>`, `<meta>`, `<base>`
- Inline handlers like `onclick=`
- `javascript:` in markup strings

## Embed policy controls

Embed-like block types are heavily controlled.

### Allowlisted embed block types

- `widgetEmbed`

### Denied embed block types

- `embed`
- `iframe`
- `scriptEmbed`
- `htmlEmbed`
- `rawHtml`

Any denied embed-like block is dropped entirely. Matching `layout` references are also removed.

## Blocking vs non-blocking violations

- **Blocking violations**
  - `denied_embed_block`
  - `unsafe_html_payload`
  - `unsafe_event_handler`
- **Non-blocking (sanitized in place)**
  - `disallowed_url_protocol`

When blocking violations occur, generation fails with an explicit category (`embed_policy_violation`, `html_payload_violation`, `event_handler_violation`, or `mixed_unsafe_content`).

## Authoring guidance for future plugins

If you build new blocks/plugins:

1. Prefer structured props (`title`, `text`, `items`, etc.) over raw HTML strings.
2. Do not rely on inline JS handlers in generated schemas.
3. Keep embed functionality behind explicit allowlisted block types.
4. Use `https/http` URLs (or root-relative where appropriate).
5. If your block needs inline HTML, request explicit allowlisting and add tests for bypass attempts.

## Testing expectations

When changing safety behavior, add/adjust tests in `lib/ai/blockSafety.test.ts` and fixtures in `lib/ai/fixtures/block-safety-malicious.json` to cover:

- protocol bypass attempts (case/whitespace tricks)
- event handler key variants
- embed type casing/spacing variants
- mixed malicious payloads
