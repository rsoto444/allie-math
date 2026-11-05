import { prisma } from "@/lib/prisma";
import { getSkillIdMap } from "@/lib/skills";
import { GRADES, ORDERED_SKILLS, type Grade, type SkillMeta } from "@/lib/curriculum";
import { PRACTICE_STREAK_TO_UNLOCK } from "@/lib/rules";

export type SkillStatus = "mastered" | "current" | "locked";

export interface SkillState extends SkillMeta {
  status: SkillStatus;
  masteredVia?: "diagnostic" | "check";
  masteredAt?: Date;
}

export interface DiagnosticState {
  status: "locked" | "available" | "in_progress" | "done";
  sessionId?: string;
  answered?: number;
  total?: number;
  correct?: number;
  finishedAt?: Date;
}

export interface GradeState {
  grade: Grade;
  name: string;
  color: string;
  skills: SkillState[];
  masteredCount: number;
  total: number;
  diagnostic: DiagnosticState;
}

export interface PathState {
  grades: GradeState[];
  /** The one skill Allie is working on right now (null when everything is mastered). */
  current: SkillState | null;
  nextAction: "checkup" | "practice" | "mastery" | "done";
  checkupGrade: Grade | null;
  practiceStreak: number;
  masteryCheckReady: boolean;
  masteredTotal: number;
  skillTotal: number;
  reviewAvailable: boolean;
}

export async function getPathState(): Promise<PathState> {
  const idMap = await getSkillIdMap();
  const masteryRows = await prisma.skillMastery.findMany({ include: { skill: true } });
  const masteredByKey = new Map(masteryRows.map((m) => [m.skill.key, m]));

  const frontier = ORDERED_SKILLS.find((s) => !masteredByKey.has(s.key)) ?? null;

  const skillStates: SkillState[] = ORDERED_SKILLS.map((s) => {
    const m = masteredByKey.get(s.key);
    if (m) {
      return { ...s, status: "mastered", masteredVia: m.via as "diagnostic" | "check", masteredAt: m.masteredAt };
    }
    return { ...s, status: frontier && frontier.key === s.key ? "current" : "locked" };
  });

  const diagnosticSessions = await prisma.assessmentSession.findMany({
    where: { mode: "diagnostic" },
    orderBy: { startedAt: "desc" },
  });

  const grades: GradeState[] = [];
  let previousDone = true;
  for (const g of GRADES) {
    const skills = skillStates.filter((s) => s.grade === g.grade);
    const finished = diagnosticSessions.find((d) => d.grade === g.grade && d.finishedAt);
    const open = diagnosticSessions.find((d) => d.grade === g.grade && !d.finishedAt);
    let diagnostic: DiagnosticState;
    if (finished) {
      diagnostic = {
        status: "done",
        sessionId: finished.id,
        correct: finished.correctCount,
        total: finished.totalQuestions,
        finishedAt: finished.finishedAt ?? undefined,
      };
    } else if (open) {
      diagnostic = {
        status: "in_progress",
        sessionId: open.id,
        answered: open.answeredCount,
        total: open.totalQuestions,
      };
    } else {
      diagnostic = { status: previousDone ? "available" : "locked" };
    }
    previousDone = diagnostic.status === "done";
    grades.push({
      grade: g.grade,
      name: g.name,
      color: g.color,
      skills,
      masteredCount: skills.filter((s) => s.status === "mastered").length,
      total: skills.length,
      diagnostic,
    });
  }

  const current = skillStates.find((s) => s.status === "current") ?? null;
  const masteredTotal = masteryRows.length;

  let nextAction: PathState["nextAction"] = "done";
  let checkupGrade: Grade | null = null;
  let practiceStreak = 0;
  let masteryCheckReady = false;

  if (current) {
    const gradeState = grades.find((g) => g.grade === current.grade)!;
    if (gradeState.diagnostic.status !== "done") {
      nextAction = "checkup";
      checkupGrade = current.grade;
    } else {
      practiceStreak = await currentPracticeStreak(idMap.get(current.key)!, current.key);
      masteryCheckReady = practiceStreak >= PRACTICE_STREAK_TO_UNLOCK;
      nextAction = masteryCheckReady ? "mastery" : "practice";
    }
  }

  return {
    grades,
    current,
    nextAction,
    checkupGrade,
    practiceStreak,
    masteryCheckReady,
    masteredTotal,
    skillTotal: ORDERED_SKILLS.length,
    reviewAvailable: masteredTotal >= 3,
  };
}

/**
 * Consecutive correct practice answers on a skill, counting only attempts made
 * after the most recent mastery check on it, so a failed check always demands
 * fresh evidence before the next try.
 */
async function currentPracticeStreak(skillId: string, skillKey: string): Promise<number> {
  const lastCheck = await prisma.assessmentSession.findFirst({
    where: { mode: "mastery", skillKey, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
  });
  const recent = await prisma.attempt.findMany({
    where: {
      skillId,
      mode: "practice",
      ...(lastCheck?.finishedAt ? { createdAt: { gt: lastCheck.finishedAt } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: PRACTICE_STREAK_TO_UNLOCK,
  });
  let streak = 0;
  for (const a of recent) {
    if (!a.correct) break;
    streak++;
  }
  return streak;
}
