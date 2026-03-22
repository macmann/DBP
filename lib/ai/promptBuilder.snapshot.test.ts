import * as assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPageGenerationPrompts, type BuildPromptInput } from "./promptBuilder";
import promptArchetypes from "./fixtures/prompt-archetypes.json";
import promptArchetypeSnapshots from "./fixtures/prompt-archetypes.snap.json";

type PromptArchetypeFixture = Omit<BuildPromptInput, "layoutRegions" | "allowedBlockTypes"> & {
  name: string;
  allowedSections: readonly string[];
};

function normalizePromptOutput(payload: ReturnType<typeof buildPageGenerationPrompts>) {
  const userSections = payload.userPrompt
    .split("\n\n")
    .filter(
      (section) => section.startsWith("Page prompt:") || section.startsWith("Prompt-suggested block types:"),
    );

  return {
    systemPromptHasLayoutRule: payload.systemPrompt.includes(
      "layout.top, layout.main, and layout.bottom must be arrays of block IDs that reference existing blocks[].id values.",
    ),
    systemPromptHasVariationRule: payload.systemPrompt.includes(
      "If two prompts differ, the resulting block plan should differ in structure, not only copy or colors.",
    ),
    userSections,
  };
}

describe("buildPageGenerationPrompts fixture snapshots", () => {
  it("matches archetype snapshots and preserves structural variation", () => {
    const fixtures = promptArchetypes as PromptArchetypeFixture[];
    const snapshot = promptArchetypeSnapshots as Record<string, ReturnType<typeof normalizePromptOutput>>;

    const generated = Object.fromEntries(
      fixtures.map((fixture) => [
        fixture.name,
        normalizePromptOutput(
          buildPageGenerationPrompts({
            pagePrompt: fixture.pagePrompt,
            referenceLinks: fixture.referenceLinks,
            assets: fixture.assets,
            allowedBlockTypes: fixture.allowedSections,
            toneBrandingHints: fixture.toneBrandingHints,
            layoutRegions: ["top", "main", "bottom"],
          }),
        ),
      ]),
    );

    assert.deepEqual(generated, snapshot);
    assert.notDeepEqual(generated.faq_first_saas.userSections, generated.storytelling_nonprofit.userSections);
    assert.notDeepEqual(
      generated.storytelling_nonprofit.userSections,
      generated.comparison_grid_b2b.userSections,
    );
  });
});
