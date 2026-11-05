import { prisma } from "@/lib/prisma";

/** Ramps practice difficulty up after two correct in a row and down after two misses. */
export async function chooseDifficulty(skillId: string): Promise<1 | 2 | 3> {
  const recent = await prisma.attempt.findMany({
    where: { skillId, mode: "practice" },
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
