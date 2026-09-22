import { prisma } from "@/lib/prisma";
import { getSkillIdMap } from "@/lib/skills";
import { SKILLS } from "@/lib/curriculum";

export interface SkillStat {
  key: string;
  id: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0..1, only meaningful when attempts > 0
  lastDifficulty: 1 | 2 | 3;
  lastPracticedAt: Date | null;
}

/** Pulls the last 10 attempts per skill and summarizes them. */
export async function getSkillStats(): Promise<SkillStat[]> {
  const idMap = await getSkillIdMap();
  const stats: SkillStat[] = [];

  for (const skill of SKILLS) {
    const id = idMap.get(skill.key)!;
    const recent = await prisma.attempt.findMany({
      where: { skillId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const correct = recent.filter((a) => a.correct).length;
    stats.push({
      key: skill.key,
      id,
      attempts: recent.length,
      correct,
      accuracy: recent.length > 0 ? correct / recent.length : 0,
      lastDifficulty: (recent[0]?.difficulty as 1 | 2 | 3) ?? 1,
      lastPracticedAt: recent[0]?.createdAt ?? null,
    });
  }

  return stats;
}

/** Weighted-random skill choice that favors unseen and weak skills, avoiding an immediate repeat. */
export function chooseSkill(stats: SkillStat[], avoidKey?: string): SkillStat {
  const candidates = stats.filter((s) => s.key !== avoidKey || stats.length === 1);

  const weighted = candidates.map((s) => {
    let weight: number;
    if (s.attempts === 0) {
      weight = 6; // never practiced - prioritize exposure
    } else {
      const errorRate = 1 - s.accuracy;
      weight = 1 + errorRate * 6; // ranges roughly 1..7
    }
    return { stat: s, weight };
  });

  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.stat;
  }
  return weighted[weighted.length - 1].stat;
}

/** Ramps difficulty up after a hot streak and down after repeated misses. */
export async function chooseDifficulty(skillId: string): Promise<1 | 2 | 3> {
  const recent = await prisma.attempt.findMany({
    where: { skillId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  if (recent.length === 0) return 1;

  const base = recent[0].difficulty as 1 | 2 | 3;
  const lastTwoCorrect = recent.length >= 2 && recent[0].correct && recent[1].correct;
  const lastTwoWrong = recent.length >= 2 && !recent[0].correct && !recent[1].correct;

  if (lastTwoCorrect && base < 3) return (base + 1) as 1 | 2 | 3;
  if (lastTwoWrong && base > 1) return (base - 1) as 1 | 2 | 3;
  return base;
}

export interface WeakArea {
  key: string;
  name: string;
  accuracy: number;
  attempts: number;
}

/** Skills with at least 3 attempts and the lowest accuracy, for progress views and the daily email. */
export function weakestAreas(stats: SkillStat[], limit = 3): WeakArea[] {
  return stats
    .filter((s) => s.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit)
    .map((s) => ({
      key: s.key,
      name: SKILLS.find((sk) => sk.key === s.key)?.name ?? s.key,
      accuracy: s.accuracy,
      attempts: s.attempts,
    }));
}
