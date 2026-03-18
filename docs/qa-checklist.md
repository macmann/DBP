# DBP QA & Release Checklist

## 1) Functional QA Checklist

### Generation success

- [ ] Home/generate flow creates a project + page without manual DB edits.
- [ ] Generation returns a successful result state and displays the latest version details.
- [ ] Generated content is saved to the current page version and visible in editor + preview routes.

### Failure messaging

- [ ] Missing prompt/input validation shows actionable, human-readable errors.
- [ ] Missing API key failure surfaces a clear setup message (no raw stack traces).
- [ ] Schema/validation failures show concise retry guidance (prompt clarity, assets, links).
- [ ] Build failures do not leave UI in an ambiguous loading state.

### URL publishing + sub-URL flow

- [ ] Public slug is created/updated predictably when page title or custom slug changes.
- [ ] Publish transitions set page to published state and update public page content.
- [ ] Old and new public routes are revalidated after slug changes.
- [ ] End-to-end sub-URL flow works from generation to final public route (including demo page).

### Responsive UI baseline

- [ ] Key screens are usable at common breakpoints (mobile, tablet, desktop).
- [ ] No overlapping controls, clipped text, or hidden primary actions.
- [ ] Tables/cards/forms remain readable and navigable on narrow viewports.

### Accessibility basics

- [ ] Page titles and section headings are hierarchical and descriptive.
- [ ] Form fields have associated labels and error text is announced/visible.
- [ ] Interactive controls are keyboard focusable with visible focus styles.
- [ ] Text and UI colors meet baseline contrast expectations.
- [ ] Images/media used in UI have meaningful alt text or decorative treatment.

### Branding consistency

- [ ] Product naming is consistently **DBP** in UI text, docs, and metadata.
- [ ] No generic scaffold phrasing remains in user-facing copy.
- [ ] Voice/tone across generation, errors, and empty states feels professional and consistent.

## 2) Visual + Manual Review Checklist (Key Screens)

### Home / Generate

- [ ] Primary generate form is clear, aligned, and visually balanced.
- [ ] Loading, success, and failure states are distinct and polished.
- [ ] CTA copy uses DBP naming and professional tone.

### Dashboard

- [ ] Project/page listings show status and navigation affordances clearly.
- [ ] Public URL actions and status badges are understandable at a glance.
- [ ] Empty states and first-run states feel intentional (not placeholder-like).

### Editor

- [ ] Form controls, version history, and page actions are visually consistent.
- [ ] Validation and save/generate feedback appears near the related controls.
- [ ] Publish-related state (draft/generating/published/failed) is obvious.

### Demo page

- [ ] Public demo route resolves correctly and renders latest published content.
- [ ] Layout/spacing/typography quality matches the app baseline.
- [ ] Links, CTA buttons, and media sections render correctly across breakpoints.

## 3) “Done” Criteria (Release Gate)

A QA pass is considered complete only when all of the following are true:

1. **No scaffold strings remain** in user-facing product surfaces.
2. **DBP naming is consistent everywhere** (UI copy, metadata, docs, and status messages).
3. **Professional UI baseline is complete** for key screens (home/generate, dashboard, editor, demo).
4. **Sub-URL publishing flow is verified end-to-end**, including slug creation/update, publish transitions, and route revalidation.
5. **Automated checks pass** for action logic and schema validation paths added for this release.
