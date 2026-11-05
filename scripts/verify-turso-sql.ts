// Simulates the production upgrade on a throwaway SQLite file: old schema
// (init migration only, with an existing Skill row) + the paste-safe
// prisma/turso/002_mastery_path.sql. Run from the repo root:
//   npx tsx scripts/verify-turso-sql.ts
import { createClient } from "@libsql/client";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const DB = `${tmpdir()}/allie-math-upgrade-check.db`;
rmSync(DB, { force: true });
const client = createClient({ url: `file:${DB}` });

function statements(path: string): string[] {
  return readFileSync(path, "utf8")
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
}

(async () => {
  for (const sql of statements("prisma/migrations/20260922031037_init/migration.sql")) await client.execute(sql);
  await client.execute(`INSERT INTO "Skill" ("id","strand","key","name","order") VALUES ('x1','NS','ns_gcf_lcm','GCF & LCM',5)`);
  for (const sql of statements("prisma/turso/002_mastery_path.sql")) await client.execute(sql);

  const tables = (await client.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)).rows.map((r) => r.name);
  const skillCols = (await client.execute(`PRAGMA table_info("Skill")`)).rows.map((r) => r.name);
  const sessionCols = (await client.execute(`PRAGMA table_info("AssessmentSession")`)).rows.map((r) => r.name);
  const row = (await client.execute(`SELECT key, grade FROM "Skill"`)).rows[0];
  console.log({ tables, skillCols, sessionCols, existingRow: row });
  if (!tables.includes("SkillMastery") || !skillCols.includes("grade") || !sessionCols.includes("plan") || row.grade !== 6) {
    throw new Error("upgrade SQL did not produce the expected schema");
  }
  console.log("Turso upgrade SQL verified OK");
})();
