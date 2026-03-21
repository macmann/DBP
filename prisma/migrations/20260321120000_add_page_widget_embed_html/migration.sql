-- Add optional HTML/script widget embed field to pages.
ALTER TABLE "Page"
ADD COLUMN "widgetEmbedHtml" TEXT;
