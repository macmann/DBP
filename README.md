# AI Demo Page Builder (MVP - Session 1)

This repository contains the **Session 1 MVP** for an AI demo page builder.

The goal of this phase is to establish the project structure, core project/page flows, and persistence layer needed for future AI-assisted generation.

## App Purpose

The app is a lightweight builder for creating demo web pages inside projects.

In Session 1, the focus is on:
- Creating and organizing projects/pages
- Navigating core dashboard and editor routes
- Saving and loading data from Postgres
- Establishing a foundation for future AI generation

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM:** Prisma

## Local Setup

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

## Database Setup / Migration / Seed

Use these commands after setting a PostgreSQL `DATABASE_URL` in your `.env` file (for example: `postgresql://postgres:postgres@localhost:5432/dbp_dev?schema=public`).

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

## Environment Variables

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | Yes | `development` | App runtime mode |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Public base URL used by the frontend |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/dbp_dev?schema=public` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | `replace-with-long-random-secret` | Session/auth secret |
| `OPENAI_API_KEY` | No (for now) | `sk-...` | Reserved for future AI generation |
| `NEXT_PUBLIC_ENABLE_PROJECT_PUBLIC_PATHS` | No | `true` | Enables optional `/p/{project}/{slug}` compatibility paths (canonical remains `/demo/{slug}`) |

## Implemented Routes (Session 1 MVP)

- `/dashboard`
- `/projects/[projectSlug]`
- `/projects/[projectSlug]/pages/new`
- `/projects/[projectSlug]/pages/[pageId]`
- `/demo/[publicSlug]` (**canonical public publishing route**)

## Publishing Model

DBP publishes each page to a globally unique `publicSlug` and serves it from:

- **Canonical URL:** `/demo/{publicSlug}`

Notes:
- `publicSlug` values are constrained to lowercase letters, numbers, and single hyphens for predictable URLs.
- Reserved words are blocked and auto-adjusted to prevent route conflicts (e.g. `demo`, `projects`, `api`).
- Collisions are resolved deterministically with numeric suffixes.

### Optional future-ready project-scoped paths

DBP can optionally accept project-scoped public paths in the future:

- `/p/{project}/{slug}`

This is disabled by default and controlled by:

- `NEXT_PUBLIC_ENABLE_PROJECT_PUBLIC_PATHS=true`

Even when enabled, `/demo/{publicSlug}` remains the canonical public URL.

## Current Status

- ✅ Session 1 foundation and route structure are in scope.
- ✅ Project/page workflow and DB-backed persistence are the core MVP goals.
- ⏳ **AI generation is not implemented yet.**

AI-assisted page generation is planned for later sessions once the core builder workflow is stable.
