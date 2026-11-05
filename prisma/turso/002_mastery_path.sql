-- Run this once in Turso's SQL shell to upgrade an existing database to the
-- mastery-path version. Same effect as prisma/migrations/20261105223707_mastery_path,
-- written as plain ALTER/CREATE statements (no table rebuild) so it's safe to paste.

ALTER TABLE "Skill" ADD COLUMN "grade" INTEGER NOT NULL DEFAULT 6;

ALTER TABLE "AssessmentSession" ADD COLUMN "grade" INTEGER;
ALTER TABLE "AssessmentSession" ADD COLUMN "passed" BOOLEAN;
ALTER TABLE "AssessmentSession" ADD COLUMN "plan" TEXT;
ALTER TABLE "AssessmentSession" ADD COLUMN "skillKey" TEXT;

CREATE TABLE "SkillMastery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "via" TEXT NOT NULL,
    "masteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillMastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SkillMastery_skillId_key" ON "SkillMastery"("skillId");
