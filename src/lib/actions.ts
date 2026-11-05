"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPin,
  createSessionToken,
  requireAuth,
} from "@/lib/auth";
import { getSkillIdMap } from "@/lib/skills";
import { GENERATORS } from "@/lib/generators";
import { mulberry32, newSeed, answersMatch, shuffle, randInt } from "@/lib/rng";
import { chooseDifficulty } from "@/lib/adaptive";
import { skillMeta, skillsForGrade, gradeMeta, type Grade } from "@/lib/curriculum";
import { getPathState, type PathState } from "@/lib/path";
import {
  DIAGNOSTIC_QUESTIONS_PER_SKILL,
  MASTERY_CHECK_LENGTH,
  MASTERY_PASS_MARK,
  REVIEW_LENGTH,
} from "@/lib/rules";
import { getStreakDays } from "@/lib/streak";

export async function loginAction(formData: FormData): Promise<void> {
  const pin = String(formData.get("pin") ?? "");
  let ok: boolean;
  try {
    ok = checkPin(pin);
  } catch {
    ok = false;
  }

  if (!ok) {
    redirect("/login?error=1");
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export type SessionMode = "diagnostic" | "mastery" | "review";
export type AttemptMode = "practice" | SessionMode;

export interface QuestionPayload {
  skillKey: string;
  skillName: string;
  topic: string;
  grade: Grade;
  difficulty: 1 | 2 | 3;
  seed: number;
  prompt: string;
  type: "numeric" | "mc";
  choices?: string[];
}

interface PlanItem {
  skillKey: string;
  difficulty: 1 | 2 | 3;
  seed: number;
}

function render(item: PlanItem): QuestionPayload {
  const generated = GENERATORS[item.skillKey](item.difficulty, mulberry32(item.seed));
  const meta = skillMeta(item.skillKey);
  return {
    skillKey: item.skillKey,
    skillName: meta.name,
    topic: meta.topic,
    grade: meta.grade,
    difficulty: item.difficulty,
    seed: item.seed,
    prompt: generated.prompt,
    type: generated.type,
    choices: generated.choices,
  };
}

/** Open-ended practice: always the current (earliest unmastered) skill, adaptive difficulty. */
export async function getPracticeQuestionAction(): Promise<QuestionPayload> {
  await requireAuth();
  const path = await getPathState();
  if (!path.current || path.nextAction === "checkup") {
    throw new Error("Practice isn't available right now - take the check-up first.");
  }
  const idMap = await getSkillIdMap();
  const difficulty = await chooseDifficulty(idMap.get(path.current.key)!);
  return render({ skillKey: path.current.key, difficulty, seed: newSeed() });
}

export interface SessionStart {
  sessionId: string;
  mode: SessionMode;
  totalQuestions: number;
  answeredCount: number;
  title: string;
}

/** Starts a grade check-up, or resumes the unfinished one for that grade. */
export async function startDiagnosticAction(grade: Grade): Promise<SessionStart> {
  await requireAuth();
  const path = await getPathState();
  const gradeState = path.grades.find((g) => g.grade === grade);
  if (!gradeState) throw new Error("Unknown grade");
  if (gradeState.diagnostic.status === "locked") {
    throw new Error("Finish the earlier grade's check-up first.");
  }
  if (gradeState.diagnostic.status === "done") {
    throw new Error("This check-up is already complete.");
  }
  if (gradeState.diagnostic.status === "in_progress" && gradeState.diagnostic.sessionId) {
    return {
      sessionId: gradeState.diagnostic.sessionId,
      mode: "diagnostic",
      totalQuestions: gradeState.diagnostic.total ?? 0,
      answeredCount: gradeState.diagnostic.answered ?? 0,
      title: `${gradeMeta(grade).name} check-up`,
    };
  }

  const rng = mulberry32(newSeed());
  const plan: PlanItem[] = [];
  for (const skill of skillsForGrade(grade)) {
    for (let d = 1; d <= DIAGNOSTIC_QUESTIONS_PER_SKILL; d++) {
      plan.push({ skillKey: skill.key, difficulty: d as 1 | 2 | 3, seed: newSeed() });
    }
  }
  const shuffled = shuffle(rng, plan);
  const session = await prisma.assessmentSession.create({
    data: { mode: "diagnostic", grade, totalQuestions: shuffled.length, plan: JSON.stringify(shuffled) },
  });
  return {
    sessionId: session.id,
    mode: "diagnostic",
    totalQuestions: shuffled.length,
    answeredCount: 0,
    title: `${gradeMeta(grade).name} check-up`,
  };
}

/** Starts a mastery check on the current skill (only once 5-in-a-row practice has unlocked it). */
export async function startMasteryCheckAction(): Promise<SessionStart> {
  await requireAuth();
  const path = await getPathState();
  if (!path.current || !path.masteryCheckReady) {
    throw new Error("The mastery check isn't unlocked yet - get 5 practice questions in a row first.");
  }
  const existing = await prisma.assessmentSession.findFirst({
    where: { mode: "mastery", skillKey: path.current.key, finishedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (existing) {
    return {
      sessionId: existing.id,
      mode: "mastery",
      totalQuestions: existing.totalQuestions,
      answeredCount: existing.answeredCount,
      title: `Mastery check: ${path.current.name}`,
    };
  }
  const rng = mulberry32(newSeed());
  const difficulties: (1 | 2 | 3)[] = [1, 1, 2, 2, 2, 2, 3, 3];
  const plan: PlanItem[] = shuffle(rng, difficulties).map((difficulty) => ({
    skillKey: path.current!.key,
    difficulty,
    seed: newSeed(),
  }));
  const session = await prisma.assessmentSession.create({
    data: {
      mode: "mastery",
      skillKey: path.current.key,
      totalQuestions: MASTERY_CHECK_LENGTH,
      plan: JSON.stringify(plan),
    },
  });
  return {
    sessionId: session.id,
    mode: "mastery",
    totalQuestions: MASTERY_CHECK_LENGTH,
    answeredCount: 0,
    title: `Mastery check: ${path.current.name}`,
  };
}

/** A short mixed review drawn only from skills already mastered. */
export async function startReviewAction(): Promise<SessionStart> {
  await requireAuth();
  const path = await getPathState();
  const mastered = path.grades.flatMap((g) => g.skills.filter((s) => s.status === "mastered"));
  if (mastered.length === 0) throw new Error("Nothing to review yet - master a skill first.");
  const rng = mulberry32(newSeed());
  const plan: PlanItem[] = [];
  let last = "";
  for (let i = 0; i < REVIEW_LENGTH; i++) {
    let pickFrom = mastered;
    if (mastered.length > 1) pickFrom = mastered.filter((s) => s.key !== last);
    const skill = pickFrom[randInt(rng, 0, pickFrom.length - 1)];
    last = skill.key;
    plan.push({ skillKey: skill.key, difficulty: randInt(rng, 1, 3) as 1 | 2 | 3, seed: newSeed() });
  }
  const session = await prisma.assessmentSession.create({
    data: { mode: "review", totalQuestions: plan.length, plan: JSON.stringify(plan) },
  });
  return {
    sessionId: session.id,
    mode: "review",
    totalQuestions: plan.length,
    answeredCount: 0,
    title: "Review",
  };
}

export interface SessionQuestion {
  question: QuestionPayload | null;
  index: number;
  total: number;
}

export async function getSessionQuestionAction(sessionId: string): Promise<SessionQuestion> {
  await requireAuth();
  const session = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!session || !session.plan) throw new Error("Session not found");
  const plan: PlanItem[] = JSON.parse(session.plan);
  const index = session.answeredCount;
  if (session.finishedAt || index >= plan.length) {
    return { question: null, index, total: plan.length };
  }
  return { question: render(plan[index]), index, total: plan.length };
}

export interface AnswerResult {
  correct: boolean;
  displayAnswer: string;
  explanation: string;
}

export async function submitAnswerAction(input: {
  skillKey: string;
  difficulty: 1 | 2 | 3;
  seed: number;
  mode: AttemptMode;
  sessionId?: string;
  userAnswer: string;
}): Promise<AnswerResult> {
  await requireAuth();

  const generator = GENERATORS[input.skillKey];
  if (!generator) throw new Error(`Unknown skill: ${input.skillKey}`);
  const generated = generator(input.difficulty, mulberry32(input.seed));
  const correct = answersMatch(input.userAnswer, generated.acceptableAnswers, generated.strict);

  const idMap = await getSkillIdMap();
  const skillId = idMap.get(input.skillKey);
  if (!skillId) throw new Error(`Unknown skill id for: ${input.skillKey}`);

  if (input.sessionId) {
    const session = await prisma.assessmentSession.findUnique({ where: { id: input.sessionId } });
    if (!session || !session.plan || session.finishedAt) throw new Error("Session not active");
    const plan: PlanItem[] = JSON.parse(session.plan);
    const expected = plan[session.answeredCount];
    if (!expected || expected.skillKey !== input.skillKey || expected.seed !== input.seed) {
      throw new Error("That question isn't the current one in this session.");
    }
    const breakdown: Record<string, { correct: number; total: number }> = session.breakdown
      ? JSON.parse(session.breakdown)
      : {};
    const entry = breakdown[input.skillKey] ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (correct) entry.correct += 1;
    breakdown[input.skillKey] = entry;

    await prisma.assessmentSession.update({
      where: { id: input.sessionId },
      data: {
        answeredCount: { increment: 1 },
        correctCount: correct ? { increment: 1 } : undefined,
        breakdown: JSON.stringify(breakdown),
      },
    });
  }

  await prisma.attempt.create({
    data: {
      skillId,
      sessionId: input.sessionId,
      mode: input.mode,
      difficulty: input.difficulty,
      prompt: generated.prompt,
      userAnswer: input.userAnswer,
      correctAnswer: generated.displayAnswer,
      correct,
    },
  });

  return { correct, displayAnswer: generated.displayAnswer, explanation: generated.explanation };
}

export interface SessionSummary {
  mode: SessionMode;
  correctCount: number;
  totalQuestions: number;
  passed: boolean | null;
  skillName?: string;
  grade?: Grade;
  breakdown: { skillKey: string; skillName: string; correct: number; total: number; mastered: boolean }[];
  newlyMastered: string[];
  gaps: string[];
}

/** Finalizes a session and applies its result to the learning path. */
export async function finishSessionAction(sessionId: string): Promise<SessionSummary> {
  await requireAuth();
  const session = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session not found");
  if (session.answeredCount < session.totalQuestions) {
    throw new Error("Not every question has been answered yet.");
  }

  const breakdownRaw: Record<string, { correct: number; total: number }> = session.breakdown
    ? JSON.parse(session.breakdown)
    : {};
  const idMap = await getSkillIdMap();
  const newlyMastered: string[] = [];
  const gaps: string[] = [];
  let passed: boolean | null = null;

  if (!session.finishedAt) {
    if (session.mode === "diagnostic") {
      for (const [key, v] of Object.entries(breakdownRaw)) {
        if (v.correct === v.total) {
          const created = await markMastered(idMap.get(key)!, "diagnostic");
          if (created) newlyMastered.push(skillMeta(key).name);
        } else {
          gaps.push(skillMeta(key).name);
        }
      }
    } else if (session.mode === "mastery" && session.skillKey) {
      passed = session.correctCount >= MASTERY_PASS_MARK;
      if (passed) {
        const created = await markMastered(idMap.get(session.skillKey)!, "check");
        if (created) newlyMastered.push(skillMeta(session.skillKey).name);
      }
    }
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date(), passed },
    });
  } else {
    passed = session.passed;
  }

  const masteredRows = await prisma.skillMastery.findMany({ include: { skill: true } });
  const masteredKeys = new Set(masteredRows.map((m) => m.skill.key));

  return {
    mode: session.mode as SessionMode,
    correctCount: session.correctCount,
    totalQuestions: session.totalQuestions,
    passed,
    skillName: session.skillKey ? skillMeta(session.skillKey).name : undefined,
    grade: (session.grade ?? undefined) as Grade | undefined,
    breakdown: Object.entries(breakdownRaw).map(([key, v]) => ({
      skillKey: key,
      skillName: skillMeta(key).name,
      correct: v.correct,
      total: v.total,
      mastered: masteredKeys.has(key),
    })),
    newlyMastered,
    gaps,
  };
}

async function markMastered(skillId: string, via: "diagnostic" | "check"): Promise<boolean> {
  const existing = await prisma.skillMastery.findUnique({ where: { skillId } });
  if (existing) return false;
  await prisma.skillMastery.create({ data: { skillId, via } });
  return true;
}

export interface ProgressData {
  path: PathState;
  streakDays: number;
  totalAttemptsAllTime: number;
  recentSessions: {
    id: string;
    mode: string;
    label: string;
    correctCount: number;
    totalQuestions: number;
    passed: boolean | null;
    finishedAt: Date;
  }[];
}

export async function getProgressAction(): Promise<ProgressData> {
  await requireAuth();
  const path = await getPathState();
  const streakDays = await getStreakDays();
  const totalAttemptsAllTime = await prisma.attempt.count();
  const sessions = await prisma.assessmentSession.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: 10,
  });
  return {
    path,
    streakDays,
    totalAttemptsAllTime,
    recentSessions: sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      label:
        s.mode === "diagnostic"
          ? `${gradeMeta(s.grade as Grade).name} check-up`
          : s.mode === "mastery"
            ? `Mastery check: ${s.skillKey ? skillMeta(s.skillKey).name : ""}`
            : "Review",
      correctCount: s.correctCount,
      totalQuestions: s.totalQuestions,
      passed: s.passed,
      finishedAt: s.finishedAt!,
    })),
  };
}
