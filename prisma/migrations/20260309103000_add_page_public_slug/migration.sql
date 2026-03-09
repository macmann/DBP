ALTER TABLE "Page"
ADD COLUMN "publicSlug" TEXT;

WITH ranked_pages AS (
  SELECT
    id,
    slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt", id) AS slug_rank
  FROM "Page"
)
UPDATE "Page" AS page
SET "publicSlug" = CASE
  WHEN ranked_pages.slug_rank = 1 THEN ranked_pages.slug
  ELSE ranked_pages.slug || '-' || ranked_pages.slug_rank::TEXT
END
FROM ranked_pages
WHERE page.id = ranked_pages.id;

ALTER TABLE "Page"
ALTER COLUMN "publicSlug" SET NOT NULL;

CREATE UNIQUE INDEX "Page_publicSlug_key" ON "Page"("publicSlug");
