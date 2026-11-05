import { prisma } from "@/lib/prisma";
import { getStreakDays } from "@/lib/streak";
import { getPathState } from "@/lib/path";
import { skillMeta, gradeMeta, type Grade } from "@/lib/curriculum";

export interface DailySummary {
  windowHours: number;
  generatedAt: string;
  practice: {
    questionsAnswered: number;
    correctAnswered: number;
    accuracy: number | null;
    minutesPracticedEstimate: number;
  };
  path: {
    masteredTotal: number;
    skillTotal: number;
    currentSkill: string | null;
    currentGrade: number | null;
    nextAction: string;
    practiceStreak: number;
    grades: { grade: number; name: string; mastered: number; total: number; checkupDone: boolean }[];
  };
  newlyMastered: { name: string; via: string }[];
  checkups: { grade: number; name: string; correct: number; total: number; gaps: string[]; solid: string[] }[];
  masteryChecks: { skill: string; correct: number; total: number; passed: boolean }[];
  reviews: { correct: number; total: number }[];
  streakDays: number;
  totalAttemptsAllTime: number;
}

export async function buildDailySummary(hours = 24): Promise<DailySummary> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const attempts = await prisma.attempt.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });
  const totalAnswered = attempts.length;
  const totalCorrect = attempts.filter((a) => a.correct).length;

  const sessions = await prisma.assessmentSession.findMany({
    where: { finishedAt: { gte: since } },
    orderBy: { finishedAt: "asc" },
  });

  const newlyMasteredRows = await prisma.skillMastery.findMany({
    where: { masteredAt: { gte: since } },
    include: { skill: true },
    orderBy: { masteredAt: "asc" },
  });

  const path = await getPathState();
  const streakDays = await getStreakDays();
  const totalAttemptsAllTime = await prisma.attempt.count();

  const checkups = sessions
    .filter((s) => s.mode === "diagnostic")
    .map((s) => {
      const breakdown: Record<string, { correct: number; total: number }> = s.breakdown ? JSON.parse(s.breakdown) : {};
      const solid: string[] = [];
      const gaps: string[] = [];
      for (const [key, v] of Object.entries(breakdown)) {
        (v.correct === v.total ? solid : gaps).push(skillMeta(key).name);
      }
      return {
        grade: s.grade ?? 0,
        name: gradeMeta((s.grade ?? 6) as Grade).name,
        correct: s.correctCount,
        total: s.totalQuestions,
        gaps,
        solid,
      };
    });

  return {
    windowHours: hours,
    generatedAt: new Date().toISOString(),
    practice: {
      questionsAnswered: totalAnswered,
      correctAnswered: totalCorrect,
      accuracy: totalAnswered > 0 ? totalCorrect / totalAnswered : null,
      // Rough estimate, not a precise timer: about 45 seconds per question.
      minutesPracticedEstimate: totalAnswered > 0 ? Math.max(1, Math.round(totalAnswered * 0.75)) : 0,
    },
    path: {
      masteredTotal: path.masteredTotal,
      skillTotal: path.skillTotal,
      currentSkill: path.current?.name ?? null,
      currentGrade: path.current?.grade ?? null,
      nextAction: path.nextAction,
      practiceStreak: path.practiceStreak,
      grades: path.grades.map((g) => ({
        grade: g.grade,
        name: g.name,
        mastered: g.masteredCount,
        total: g.total,
        checkupDone: g.diagnostic.status === "done",
      })),
    },
    newlyMastered: newlyMasteredRows.map((m) => ({ name: m.skill.name, via: m.via })),
    checkups,
    masteryChecks: sessions
      .filter((s) => s.mode === "mastery")
      .map((s) => ({
        skill: s.skillKey ? skillMeta(s.skillKey).name : "",
        correct: s.correctCount,
        total: s.totalQuestions,
        passed: s.passed ?? false,
      })),
    reviews: sessions.filter((s) => s.mode === "review").map((s) => ({ correct: s.correctCount, total: s.totalQuestions })),
    streakDays,
    totalAttemptsAllTime,
  };
}
