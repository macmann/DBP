-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("id", "name", "slug", "description", "createdAt", "updatedAt")
SELECT "id", "name", lower(replace(trim("name"), ' ', '-')) || '-' || substr("id", 1, 6), "description", "createdAt", "updatedAt"
FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

ALTER TABLE "Page" ADD COLUMN "prompt" TEXT;
ALTER TABLE "Page" ADD COLUMN "referenceLinks" JSON;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
