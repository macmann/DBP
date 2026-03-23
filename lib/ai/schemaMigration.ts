import type { GeneratedPageSchema, ValidationResult } from "@/lib/ai/schema";
import {
  migrateLegacySectionsPayload,
  sanitizeGeneratedPageSchema,
  validateGeneratedPageSchema,
} from "@/lib/ai/schema";

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function normalizeGeneratedSchemaForRuntime(payload: unknown): ValidationResult<GeneratedPageSchema> {
  const legacyMigrated = migrateLegacySectionsPayload(payload);
  const sanitized = sanitizeGeneratedPageSchema(legacyMigrated);
  return validateGeneratedPageSchema(sanitized);
}

export function migrateStoredGeneratedSchema(payload: unknown): {
  migratedPayload: unknown;
  changed: boolean;
} {
  const legacyMigrated = migrateLegacySectionsPayload(payload);
  const sanitized = sanitizeGeneratedPageSchema(legacyMigrated);

  return {
    migratedPayload: sanitized,
    changed: !deepEqual(payload, sanitized),
  };
}
