import { prisma } from "@/lib/prisma";
import { SKILLS } from "@/lib/curriculum";

let cachedMap: Map<string, string> | null = null;

/**
 * Keeps the Skill table in sync with the curriculum (inserting new skills,
 * refreshing names/grades of existing ones) and returns a key -> id map.
 * Cached per server process after the first sync.
 */
export async function getSkillIdMap(): Promise<Map<string, string>> {
  if (cachedMap) return cachedMap;

  const existing = await prisma.skill.findMany();
  const byKey = new Map(existing.map((s) => [s.key, s]));

  for (const s of SKILLS) {
    const row = byKey.get(s.key);
    if (!row) {
      await prisma.skill.create({
        data: { key: s.key, strand: s.topic, name: s.name, order: s.order, grade: s.grade },
      });
    } else if (row.name !== s.name || row.grade !== s.grade || row.order !== s.order || row.strand !== s.topic) {
      await prisma.skill.update({
        where: { id: row.id },
        data: { name: s.name, grade: s.grade, order: s.order, strand: s.topic },
      });
    }
  }

  const all = await prisma.skill.findMany();
  cachedMap = new Map(all.map((s) => [s.key, s.id]));
  return cachedMap;
}
