-- AlterTable
ALTER TABLE "AssessmentSession" ADD COLUMN "grade" INTEGER;
ALTER TABLE "AssessmentSession" ADD COLUMN "passed" BOOLEAN;
ALTER TABLE "AssessmentSession" ADD COLUMN "plan" TEXT;
ALTER TABLE "AssessmentSession" ADD COLUMN "skillKey" TEXT;

-- CreateTable
CREATE TABLE "SkillMastery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "via" TEXT NOT NULL,
    "masteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillMastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strand" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 6
);
INSERT INTO "new_Skill" ("id", "key", "name", "order", "strand") SELECT "id", "key", "name", "order", "strand" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
CREATE UNIQUE INDEX "Skill_key_key" ON "Skill"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SkillMastery_skillId_key" ON "SkillMastery"("skillId");
