ALTER TABLE "Asset"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_assets AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE("pageId", "projectId")
      ORDER BY "createdAt" ASC
    ) - 1 AS sort_index
  FROM "Asset"
)
UPDATE "Asset"
SET "sortOrder" = ordered_assets.sort_index
FROM ordered_assets
WHERE "Asset"."id" = ordered_assets.id;

CREATE INDEX "Asset_pageId_sortOrder_idx" ON "Asset"("pageId", "sortOrder");
