-- AlterTable
ALTER TABLE "Project" ADD COLUMN "slug" TEXT;

-- Backfill slug for existing rows
UPDATE "Project"
SET "slug" = lower(regexp_replace(trim("name"), '\\s+', '-', 'g')) || '-' || substring("id", 1, 6)
WHERE "slug" IS NULL;

-- Enforce not-null and uniqueness
ALTER TABLE "Project" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- AlterTable
ALTER TABLE "Page" ADD COLUMN "prompt" TEXT,
ADD COLUMN "referenceLinks" JSONB;
