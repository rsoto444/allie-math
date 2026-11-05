"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  getPracticeQuestionAction,
  submitAnswerAction,
  type AnswerResult,
  type QuestionPayload,
} from "@/lib/actions";
import { QuestionCard } from "@/components/QuestionCard";
import { PRACTICE_STREAK_TO_UNLOCK } from "@/lib/rules";

export function PracticeSession({
  skillName,
  initialStreak,
}: {
  skillName: string;
  initialStreak: number;
}) {
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [streak, setStreak] = useState(initialStreak);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [isPending, startTransition] = useTransition();

  function fetchQuestion() {
    startTransition(async () => {
      const q = await getPracticeQuestionAction();
      setQuestion(q);
    });
  }

  useEffect(() => {
    fetchQuestion();
  }, []);

  function submit(userAnswer: string) {
    if (!question) return;
    startTransition(async () => {
      const res = await submitAnswerAction({
        skillKey: question.skillKey,
        difficulty: question.difficulty,
        seed: question.seed,
        mode: "practice",
        userAnswer,
      });
      setResult(res);
      setSessionTotal((t) => t + 1);
      if (res.correct) {
        setSessionCorrect((c) => c + 1);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }
    });
  }

  function next() {
    setResult(null);
    fetchQuestion();
  }

  const unlocked = streak >= PRACTICE_STREAK_TO_UNLOCK;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Working on</div>
          <div className="font-display text-base font-bold">{skillName}</div>
        </div>
        <span className="text-muted">
          {sessionCorrect} / {sessionTotal} correct
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-card-border bg-card px-4 py-3" data-testid="streak-box">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold">
            {unlocked ? "Mastery check unlocked!" : `Get ${PRACTICE_STREAK_TO_UNLOCK} in a row to unlock the Mastery Check`}
          </span>
          <span className="text-muted" data-testid="streak-count">
            {Math.min(streak, PRACTICE_STREAK_TO_UNLOCK)} / {PRACTICE_STREAK_TO_UNLOCK}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: PRACTICE_STREAK_TO_UNLOCK }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-full ${i < streak ? "bg-success" : "bg-card-border"}`}
            />
          ))}
        </div>
        {unlocked && (
          <Link
            href="/mastery"
            data-testid="mastery-link"
            className="mt-3 block w-full rounded-xl bg-success py-2.5 text-center font-semibold text-white"
          >
            Take the Mastery Check →
          </Link>
        )}
      </div>

      {!question ? (
        <div className="py-16 text-center text-muted">Loading a question...</div>
      ) : (
        <QuestionCard
          key={`${question.skillKey}:${question.seed}`}
          question={question}
          result={result}
          isPending={isPending}
          onSubmit={submit}
          onNext={next}
          nextLabel="Next question →"
        />
      )}
    </div>
  );
}
