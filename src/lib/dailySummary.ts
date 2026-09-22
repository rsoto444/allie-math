import { prisma } from "@/lib/prisma";
import { getSkillStats, weakestAreas, type WeakArea } from "@/lib/adaptive";
import { getStreakDays } from "@/lib/streak";
import { strandOf } from "@/lib/curriculum";

export interface DailySummary {
  windowHours: number;
  generatedAt: string;
  practice: {
    questionsAnswered: number;
    correctAnswered: number;
    accuracy: number | null;
    minutesPracticedEstimate: number;
  };
  byStrand: { strand: string; correct: number; total: number; accuracy: number | null }[];
  assessments: { mode: string; correct: number; total: number; finishedAt: Date | null }[];
  weakestAreasAllTime: WeakArea[];
  streakDays: number;
  totalAttemptsAllTime: number;
}

export async function buildDailySummary(hours = 24): Promise<DailySummary> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const attempts = await prisma.attempt.findMany({
    where: { createdAt: { gte: since } },
    include: { skill: true },
    orderBy: { createdAt: "asc" },
  });

  const sessions = await prisma.assessmentSession.findMany({
    where: { startedAt: { gte: since }, finishedAt: { not: null } },
    orderBy: { startedAt: "asc" },
  });

  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter((a) => a.correct).length;

  const byStrand = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const strand = strandOf(a.skill.key);
    const entry = byStrand.get(strand.name) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a.correct) entry.correct += 1;
    byStrand.set(strand.name, entry);
  }

  const stats = await getSkillStats();
  const weakest = weakestAreas(stats, 3);
  const streakDays = await getStreakDays();
  const totalAttemptsAllTime = await prisma.attempt.count();

  // Rough estimate, not a precise timer: about 45 seconds per question answered.
  const minutesPracticedEstimate =
    totalAnswered > 0 ? Math.max(1, Math.round(totalAnswered * 0.75)) : 0;

  return {
    windowHours: hours,
    generatedAt: new Date().toISOString(),
    practice: {
      questionsAnswered: totalAnswered,
      correctAnswered: totalCorrect,
      accuracy: totalAnswered > 0 ? totalCorrect / totalAnswered : null,
      minutesPracticedEstimate,
    },
    byStrand: Array.from(byStrand.entries()).map(([name, v]) => ({
      strand: name,
      correct: v.correct,
      total: v.total,
      accuracy: v.total > 0 ? v.correct / v.total : null,
    })),
    assessments: sessions.map((s) => ({
      mode: s.mode,
      correct: s.correctCount,
      total: s.totalQuestions,
      finishedAt: s.finishedAt,
    })),
    weakestAreasAllTime: weakest,
    streakDays,
    totalAttemptsAllTime,
  };
}
