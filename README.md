# DBP (Demo Builder Product)

DBP is a **prompt-to-page** product: you provide a prompt, DBP builds a marketing-style page, and publishes it at a public sub-URL.

- Canonical public URL pattern: `/demo/{slug}`
- Optional compatibility route: `/p/{project}/{slug}` (feature-flagged)

## Product behavior (current)

DBP already supports AI-assisted page generation in the build flow:

- You can create projects and pages in the dashboard.
- You can provide a prompt and supporting links/assets.
- You can run **Build page** to generate a new structured page version.
- Published output is available at `/demo/{publicSlug}`.

## Happy path

1. **Create a prompt**

   - Open the dashboard and create a project + page.
   - Add a clear prompt (goal, audience, offer) and optional reference links/assets.

2. **Build**

   - Click **Build page** in the page editor.
   - DBP generates content, validates it, and saves a new page version.

3. **Open the public URL**
   - Visit `/demo/{slug}` (for example, `/demo/spring-launch`).
   - Share this URL as the canonical public page link.

## Core routes

- `/dashboard`
- `/projects/[projectSlug]`
- `/projects/[projectSlug]/pages/new`
- `/projects/[projectSlug]/pages/[pageId]`
- `/demo/[slug]` (**canonical public publishing route**)
- `/p/[project]/[slug]` (optional compatibility route when enabled)

## Publishing model

DBP assigns each page a globally unique `publicSlug`.

- **Canonical URL:** `/demo/{publicSlug}`
- **Optional compatibility URL:** `/p/{project}/{publicSlug}` when enabled

Notes:

- `publicSlug` values are normalized to lowercase letters, numbers, and single hyphens.
- Reserved words are blocked/adjusted to avoid route conflicts (`demo`, `projects`, `api`, etc.).
- Collisions resolve deterministically via numeric suffixes.

### Public path flag

Set this to enable compatibility project-scoped paths:

- `NEXT_PUBLIC_ENABLE_PROJECT_PUBLIC_PATHS=true`

Even when enabled, `/demo/{publicSlug}` remains canonical.

## Tech stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + design tokens
- **Database:** PostgreSQL
- **ORM:** Prisma
- **AI provider:** OpenAI Responses API

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start local development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Database setup / migration / seed

Use these commands after setting a PostgreSQL `DATABASE_URL` in `.env` (for example: `postgresql://postgres:postgres@localhost:5432/dbp_dev?schema=public`).

1. Generate Prisma client:

```bash
npx prisma generate
```

2. Run local migrations:

```bash
npx prisma migrate dev
```

3. Seed database:

```bash
npm run db:seed
```

4. (Optional) Open Prisma Studio:

```bash
npx prisma studio
```

## Render deployment

DBP is now set up for Render using `render.yaml` at the repo root.

### Render commands

Use these commands in Render (already configured in `render.yaml`):

- **Build Command**

```bash
npm ci && npm run build:render
```

- **Start Command**

```bash
npm run start:render
```

`build:render` runs Prisma client generation + production migrations + Next.js build:

```bash
prisma generate && prisma migrate deploy && next build
```

`start:render` runs migrations again at boot (safe/idempotent) before starting the server:

```bash
prisma migrate deploy && next start
```

> Why migrations in both? Render can build and run in separate phases. Running `prisma migrate deploy` at start ensures schema is up-to-date on runtime boot as well.

## Environment variables

| Variable                                  | Required           | Example                                                               | Purpose                                                                                       |
| ----------------------------------------- | ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                | Yes                | `development`                                                         | App runtime mode                                                                              |
| `NEXT_PUBLIC_APP_URL`                     | Yes                | `http://localhost:3000`                                               | Public base URL used by the frontend                                                          |
| `DATABASE_URL`                            | Yes                | `postgresql://postgres:postgres@localhost:5432/dbp_dev?schema=public` | PostgreSQL connection string                                                                  |
| `NEXTAUTH_SECRET`                         | Yes                | `replace-with-long-random-secret`                                     | Session/auth secret                                                                           |
| `OPENAI_API_KEY`                          | Yes (for AI build) | `sk-...`                                                              | Used by build actions that generate page schema                                               |
| `OPENAI_MODEL`                            | No                 | `gpt-4.1-mini`                                                        | Optional override for generation model                                                        |
| `NEXT_PUBLIC_ENABLE_PROJECT_PUBLIC_PATHS` | No                 | `true`                                                                | Enables optional `/p/{project}/{slug}` compatibility paths (canonical remains `/demo/{slug}`) |

## Branding and naming guidance

**Brand name is DBP.**

- Use **DBP** in product copy, docs, UI text, commit messages, and PR descriptions.
- Never refer to the product as **Scaffold**.
- When updating legacy text, replace “Scaffold” with “DBP” unless a historical note explicitly requires the old term.

## UI standards summary

To keep DBP consistent, contributors should follow these UI standards:

### 1) Tokens first

- Use the CSS variables defined in `app/globals.css` for:
  - Color (`--color-*`)
  - Typography (`--text-*`)
  - Spacing (`--space-*`)
  - Radius (`--radius-*`)
  - Shadow (`--shadow-*`)
- Prefer token-backed Tailwind utility classes (`bg-surface-elevated`, `text-fg`, `border-border`, etc.) over hardcoded color values.

### 2) Reuse shared components

- Prefer existing primitives in `components/ui` (e.g., `Button`, `Input`, `TextArea`, `Card`, `Alert`) before introducing new variants.
- Keep variant additions intentional and minimal; avoid one-off styling forks.

### 3) Accessibility baseline

- Use semantic elements and explicit `<label htmlFor="...">` + form control `id` pairing.
- Preserve focus visibility (`focus-visible` rings) on all interactive controls.
- Provide `aria-invalid`/`aria-describedby` wiring for form validation states.
- Ensure color choices maintain readable contrast in both light and dark themes.

### 4) Public page quality

- Generated pages should remain readable and scannable on mobile and desktop.
- Keep section hierarchy clear (headline → supporting copy → CTA).
- Avoid shipping placeholder/demo-only copy when publishing real demos.

## QA sign-off checklist

Use `docs/qa-checklist.md` as the release QA gate for generation outcomes, URL publishing flow, responsive/accessibility checks, visual reviews, and final done criteria.

## Contribution checklist

Before opening a PR, confirm:

- [ ] Product naming says **DBP** only (no “Scaffold”).
- [ ] Any route docs/examples use `/demo/{slug}` as canonical.
- [ ] New UI uses shared tokens/components, not ad-hoc styling.
- [ ] Forms/interactive elements meet accessibility baseline (labels, focus, ARIA states).
- [ ] README/docs reflect current behavior (no outdated MVP/session caveats).
- [ ] If behavior changed, examples and env var docs were updated.
