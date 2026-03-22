# Prompt Template (Sample)

Use this as a starter prompt in **Prompt – Provide generation instructions for this page**.
It is intentionally verbose so you can trim or expand it based on your project.

---

## 1) Page Goal
- Build a high-converting landing page for **[Company / Offer]**.
- Primary objective: **[book calls / capture leads / start trial / sell product]**.
- Primary audience: **[who they are, role, pain points]**.
- Tone: **[confident / friendly / premium / technical]**.

## 2) Brand / Theme
- Primary color: `#3B82F6`
- Accent color: `#22D3EE`
- Font family: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
- Visual direction: clean modern SaaS, strong contrast, readable spacing.

## 3) Layout Instructions (Instruction-Driven)
Generate a structure that follows these layout requirements:
- Hero must be `layoutVariant: "split"` (message + visual side-by-side).
- Social proof/logo strip immediately after hero.
- Features section should use `layoutVariant: "cards-3"` (or `cards-4` if enough items).
- Include one `imageText` section with `layoutVariant: "media-left"` to break rhythm.
- Add testimonial section with `layoutVariant: "cards-3"`.
- Include FAQ near the bottom.
- Final CTA should use `layoutVariant: "split"` with button aligned to the right.
- Avoid default boilerplate ordering if it conflicts with these instructions.

## 4) Content Requirements
- Headline should clearly state the transformation/outcome.
- Body copy should be concise and benefit-focused.
- Include concrete proof points (metrics, outcomes, credibility cues).
- CTA labels should be action-oriented (e.g., “Book Strategy Call”, “Start Free Audit”).

## 5) SEO Requirements
- SEO title <= 70 chars.
- SEO description <= 160 chars.
- Keep language specific to audience intent and offer.

## 6) Section Wishlist (Adjust as needed)
Preferred sections (in this rough order):
1. hero
2. logoStrip
3. features
4. imageText
5. testimonial
6. faq
7. cta
8. footer

## 7) Output Expectations
- Respect section hierarchy and narrative flow.
- Use uploaded assets where semantically relevant.
- Keep layout instruction-based, not template-repeated.

---

### Minimal Short Version

Build a landing page for **[offer]** targeting **[audience]** with goal **[conversion goal]**.  
Theme: primary `#3B82F6`, accent `#22D3EE`, font `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`.  
Use instruction-driven layout: hero `split`, features `cards-3`, one imageText `media-left`, testimonials `cards-3`, FAQ near bottom, final CTA `split`.  
Avoid default boilerplate ordering if instructions differ.  
Keep copy concise and conversion-focused; include strong CTA and valid SEO fields.
