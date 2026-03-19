# DBP User Guide (User Perspective)

This guide explains how to use DBP as an end user to create, build, and share a public marketing/demo page.

## What DBP does

DBP turns a prompt into a publishable landing page.

- You write what you want (goal, audience, offer, tone).
- DBP generates a structured page draft.
- You review/edit.
- You publish and share a public URL.

Canonical public URL format:

- `/demo/{publicSlug}`

## Before you start

Ask your admin/team for:

- A DBP account (if auth is enabled)
- The DBP app URL (for example `http://localhost:3000` in local/dev)
- Confirmation that AI build is configured (OpenAI key/model on the server)

## Quick start (5-minute flow)

1. Open DBP and go to **Dashboard** (`/dashboard`).
2. Create a **Project** (container for related pages).
3. Inside the project, create a **Page**.
4. In the page editor, enter:
   - Main prompt (goal, audience, offer, CTA)
   - Optional reference links
   - Optional uploaded assets/images
5. Click **Build page**.
6. Wait for generation to complete and review the output.
7. Publish/share the page via `/demo/{publicSlug}`.

## Recommended prompt template

Use this template to improve generation quality:

- **Objective:** What result should the page drive?
- **Audience:** Who is this for?
- **Offer:** What are you promoting?
- **Value props:** Top 3 benefits.
- **Proof:** Testimonials, metrics, logos, trust signals.
- **CTA:** Primary action (e.g., “Book demo”).
- **Tone/style:** Brand voice and constraints.

Example:

> Build a B2B SaaS launch page for IT directors. Promote faster incident response and lower downtime. Include 3 value props, a customer quote section, and one clear CTA: “Request a demo”. Tone: direct, trustworthy, minimal jargon.

## How to review generated output

After building, check:

- Headline clarity (clear promise)
- Section flow (problem → solution → proof → CTA)
- Accuracy of claims and links
- Brand/tone alignment
- Mobile readability

If needed, refine the prompt and run **Build page** again to create a new version.

## Publishing and sharing

- Share the canonical URL: `/demo/{publicSlug}`
- If compatibility mode is enabled by admins, a project-scoped route may also work: `/p/{project}/{publicSlug}`
- Prefer `/demo/{publicSlug}` in all external sharing

## Common user mistakes (and fixes)

1. **Prompt too vague**
   - Fix: add audience + offer + CTA + proof requirements.
2. **Weak CTA**
   - Fix: ask for one specific primary CTA.
3. **Unverified claims**
   - Fix: replace placeholders with approved proof points.
4. **Poor visual hierarchy**
   - Fix: request shorter headings and clearer section order.

## Troubleshooting

- **Build fails:** ask admin to verify server-side AI/env setup.
- **Page not found on public URL:** confirm the correct `publicSlug`.
- **Assets missing:** re-upload and rebuild.
- **Unexpected wording:** tighten prompt constraints and regenerate.

## Best practices for reliable results

- Keep one page focused on one audience and one conversion goal.
- Use concrete facts over generic marketing language.
- Rebuild iteratively instead of trying one giant prompt.
- Final human QA before sharing publicly.

## Route reference (for users)

- Dashboard: `/dashboard`
- Projects list: `/projects`
- Project detail: `/projects/{projectSlug}`
- New page: `/projects/{projectSlug}/pages/new`
- Page editor: `/projects/{projectSlug}/pages/{pageId}`
- Public page (canonical): `/demo/{publicSlug}`

