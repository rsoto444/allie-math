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
import { mulberry32, newSeed, answersMatch } from "@/lib/rng";
import { chooseSkill, chooseDifficulty, getSkillStats, weakestAreas } from "@/lib/adaptive";
import { SKILLS, STRANDS, skillName, strandOf } from "@/lib/curriculum";
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

export interface QuestionPayload {
  skillKey: string;
  skillName: string;
  strandName: string;
  strandColor: string;
  difficulty: 1 | 2 | 3;
  seed: number;
  prompt: string;
  type: "numeric" | "mc";
  choices?: string[];
}

const QUIZ_LENGTH = 12;
const TEST_LENGTH = 20;

export async function getNextQuestionAction(
  mode: "practice" | "quiz" | "test",
  avoidKey?: string
): Promise<QuestionPayload> {
  await requireAuth();

  const stats = await getSkillStats();
  const chosen = chooseSkill(stats, avoidKey);
  const difficulty =
    mode === "practice" ? await chooseDifficulty(chosen.id) : pickAssessmentDifficulty(mode);
  const seed = newSeed();
  const rng = mulberry32(seed);
  const generated = GENERATORS[chosen.key](difficulty, rng);
  const strand = strandOf(chosen.key);

  return {
    skillKey: chosen.key,
    skillName: skillName(chosen.key),
    strandName: strand.name,
    strandColor: strand.color,
    difficulty,
    seed,
    prompt: generated.prompt,
    type: generated.type,
    choices: generated.choices,
  };
}

function pickAssessmentDifficulty(mode: "quiz" | "test"): 1 | 2 | 3 {
  const roll = Math.random();
  if (mode === "quiz") {
    return roll < 0.5 ? 1 : roll < 0.85 ? 2 : 3;
  }
  return roll < 0.3 ? 1 : roll < 0.7 ? 2 : 3;
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
  mode: "practice" | "quiz" | "test";
  sessionId?: string;
  userAnswer: string;
}): Promise<AnswerResult> {
  await requireAuth();

  const rng = mulberry32(input.seed);
  const generator = GENERATORS[input.skillKey];
  if (!generator) throw new Error(`Unknown skill: ${input.skillKey}`);
  const generated = generator(input.difficulty, rng);
  const correct = answersMatch(input.userAnswer, generated.acceptableAnswers);

  const idMap = await getSkillIdMap();
  const skillId = idMap.get(input.skillKey);
  if (!skillId) throw new Error(`Unknown skill id for: ${input.skillKey}`);

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

  if (input.sessionId) {
    const session = await prisma.assessmentSession.findUnique({ where: { id: input.sessionId } });
    if (session) {
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
  }

  return {
    correct,
    displayAnswer: generated.displayAnswer,
    explanation: generated.explanation,
  };
}

export interface AssessmentStart {
  sessionId: string;
  totalQuestions: number;
}

export async function startAssessmentAction(mode: "quiz" | "test"): Promise<AssessmentStart> {
  await requireAuth();
  const totalQuestions = mode === "quiz" ? QUIZ_LENGTH : TEST_LENGTH;
  const session = await prisma.assessmentSession.create({
    data: { mode, totalQuestions },
  });
  return { sessionId: session.id, totalQuestions };
}

export interface AssessmentSummary {
  correctCount: number;
  totalQuestions: number;
  breakdown: { skillKey: string; skillName: string; correct: number; total: number }[];
}

export async function finishAssessmentAction(sessionId: string): Promise<AssessmentSummary> {
  await requireAuth();
  const session = await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { finishedAt: new Date() },
  });

  const breakdownRaw: Record<string, { correct: number; total: number }> = session.breakdown
    ? JSON.parse(session.breakdown)
    : {};

  const breakdown = Object.entries(breakdownRaw).map(([key, v]) => ({
    skillKey: key,
    skillName: skillName(key),
    correct: v.correct,
    total: v.total,
  }));

  return {
    correctCount: session.correctCount,
    totalQuestions: session.totalQuestions,
    breakdown,
  };
}

export interface ProgressData {
  strands: {
    key: string;
    name: string;
    color: string;
    attempts: number;
    accuracy: number;
  }[];
  weakest: { key: string; name: string; accuracy: number; attempts: number }[];
  recentAssessments: {
    id: string;
    mode: string;
    correctCount: number;
    totalQuestions: number;
    finishedAt: Date | null;
    startedAt: Date;
  }[];
  totalAttemptsAllTime: number;
  streakDays: number;
}

export async function getProgressAction(): Promise<ProgressData> {
  await requireAuth();
  const stats = await getSkillStats();

  const strandRows = STRANDS.map((strand) => {
    const skillsInStrand = SKILLS.filter((s) => s.strand === strand.key).map((s) => s.key);
    const relevant = stats.filter((s) => skillsInStrand.includes(s.key));
    const attempts = relevant.reduce((sum, s) => sum + s.attempts, 0);
    const correct = relevant.reduce((sum, s) => sum + s.correct, 0);
    return {
      key: strand.key,
      name: strand.name,
      color: strand.color,
      attempts,
      accuracy: attempts > 0 ? correct / attempts : 0,
    };
  });

  const recentAssessments = await prisma.assessmentSession.findMany({
    where: { finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 8,
  });

  const totalAttemptsAllTime = await prisma.attempt.count();
  const streakDays = await getStreakDays();

  return {
    strands: strandRows,
    weakest: weakestAreas(stats, 3),
    recentAssessments: recentAssessments.map((a) => ({
      id: a.id,
      mode: a.mode,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      finishedAt: a.finishedAt,
      startedAt: a.startedAt,
    })),
    totalAttemptsAllTime,
    streakDays,
  };
}
