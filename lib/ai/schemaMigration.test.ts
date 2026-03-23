import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import legacySavedVersionFixture from "./fixtures/saved-version-v1.json";
import currentSavedVersionFixture from "./fixtures/saved-version-v2.json";
import { migrateStoredGeneratedSchema, normalizeGeneratedSchemaForRuntime } from "./schemaMigration";

describe("schemaMigration", () => {
  it("normalizes legacy saved versions for runtime rendering", () => {
    const result = normalizeGeneratedSchemaForRuntime(legacySavedVersionFixture);

    assert.equal(result.success, true);
    if (!result.success) {
      return;
    }

    assert.equal(result.data.schemaVersion, 2);
    assert.ok(Array.isArray(result.data.blocks));
    assert.ok(Array.isArray(result.data.layout?.main));
  });

  it("reports no-op when stored payload is already current", () => {
    const migrated = migrateStoredGeneratedSchema(currentSavedVersionFixture);

    assert.equal(migrated.changed, false);
  });

  it("reports change when stored payload is legacy", () => {
    const migrated = migrateStoredGeneratedSchema(legacySavedVersionFixture);

    assert.equal(migrated.changed, true);
  });
});
