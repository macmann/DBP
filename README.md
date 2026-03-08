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

## Implemented Routes (Session 1 MVP)

- `/dashboard`
- `/projects/[projectSlug]`
- `/projects/[projectSlug]/pages/new`
- `/projects/[projectSlug]/pages/[pageId]`

## Current Status

- ✅ Session 1 foundation and route structure are in scope.
- ✅ Project/page workflow and DB-backed persistence are the core MVP goals.
- ⏳ **AI generation is not implemented yet.**

AI-assisted page generation is planned for later sessions once the core builder workflow is stable.
