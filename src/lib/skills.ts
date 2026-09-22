import { prisma } from "@/lib/prisma";
import { SKILLS } from "@/lib/curriculum";

let cachedMap: Map<string, string> | null = null;

/** Ensures every curriculum skill exists in the DB and returns a key -> id map. Cached per server process. */
export async function getSkillIdMap(): Promise<Map<string, string>> {
  if (cachedMap) return cachedMap;

  const existing = await prisma.skill.findMany();
  const existingKeys = new Set(existing.map((s) => s.key));
  const missing = SKILLS.filter((s) => !existingKeys.has(s.key));

  if (missing.length > 0) {
    await prisma.skill.createMany({
      data: missing.map((s) => ({
        key: s.key,
        strand: s.strand,
        name: s.name,
        order: s.order,
      })),
    });
  }

  const all = await prisma.skill.findMany();
  cachedMap = new Map(all.map((s) => [s.key, s.id]));
  return cachedMap;
}

export async function getSkillIdMapReverse(): Promise<Map<string, string>> {
  const map = await getSkillIdMap();
  const reverse = new Map<string, string>();
  for (const [key, id] of map) reverse.set(id, key);
  return reverse;
}
