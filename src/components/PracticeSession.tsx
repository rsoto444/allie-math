"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getNextQuestionAction,
  submitAnswerAction,
  type AnswerResult,
  type QuestionPayload,
} from "@/lib/actions";

const PRAISE = ["Nice work! 🎉", "You got it! ✨", "Boom! Correct! 💪", "That's it! 🌟", "Great job! 🙌"];
const ENCOURAGE = [
  "Not quite - let's see why.",
  "So close! Here's the trick:",
  "Good try - here's how to get it next time:",
  "Almost! Take a look:",
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Mode = "practice" | "quiz" | "test";

export function PracticeSession({
  mode = "practice",
  onFinished,
  totalTarget,
  sessionId,
}: {
  mode?: Mode;
  onFinished?: () => void;
  totalTarget?: number;
  sessionId?: string;
}) {
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [lastSkillKey, setLastSkillKey] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function fetchQuestion(avoidKey?: string) {
    startTransition(async () => {
      const q = await getNextQuestionAction(mode, avoidKey);
      setQuestion(q);
    });
  }

  function loadNext(avoidKey?: string) {
    setResult(null);
    setAnswer("");
    fetchQuestion(avoidKey);
  }

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(chosenAnswer?: string) {
    if (!question) return;
    const finalAnswer = chosenAnswer ?? answer;
    if (finalAnswer.trim() === "") return;

    startTransition(async () => {
      const res = await submitAnswerAction({
        skillKey: question.skillKey,
        difficulty: question.difficulty,
        seed: question.seed,
        mode,
        sessionId,
        userAnswer: finalAnswer,
      });
      setResult(res);
      setSessionTotal((t) => t + 1);
      if (res.correct) setSessionCorrect((c) => c + 1);
      setLastSkillKey(question.skillKey);
    });
  }

  function next() {
    if (totalTarget && sessionTotal >= totalTarget) {
      onFinished?.();
      return;
    }
    loadNext(lastSkillKey);
  }

  if (!question) {
    return <div className="py-16 text-center text-muted">Loading a question...</div>;
  }

  const progressLabel = totalTarget ? `Question ${sessionTotal + 1} of ${totalTarget}` : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand-dark">
          {question.strandName}
        </span>
        <span className="text-muted">
          {progressLabel ?? `${sessionCorrect} / ${sessionTotal} correct`}
        </span>
      </div>

      {totalTarget && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-card-border">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(sessionTotal / totalTarget) * 100}%` }}
          />
        </div>
      )}

      <div className="rounded-3xl border border-card-border bg-card p-6 shadow-sm" data-testid="question-card" data-question-key={`${question.skillKey}:${question.seed}`}>
        <p
          className="whitespace-pre-wrap font-display text-xl font-semibold leading-relaxed"
          data-testid="question-prompt"
        >
          {question.prompt}
        </p>

        {!result && question.type === "mc" && question.choices && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                disabled={isPending}
                data-testid="mc-choice"
                onClick={() => submit(choice)}
                className="rounded-2xl border border-card-border bg-background px-4 py-3 text-left font-semibold transition-colors hover:border-brand hover:bg-brand-soft disabled:opacity-50"
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {!result && question.type === "numeric" && (
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              autoFocus
              type="text"
              inputMode="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer"
              data-testid="answer-input"
              className="flex-1 rounded-xl border border-card-border bg-background px-4 py-3 font-semibold outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={isPending || answer.trim() === ""}
              data-testid="check-button"
              className="rounded-xl bg-brand px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Check
            </button>
          </form>
        )}

        {result && (
          <div className="mt-6" data-testid="feedback">
            <div
              className={`rounded-2xl p-4 ${
                result.correct ? "bg-success-soft" : "bg-danger-soft"
              }`}
            >
              <p
                className={`font-display text-lg font-bold ${
                  result.correct ? "text-success" : "text-danger"
                }`}
              >
                {result.correct ? pickRandom(PRAISE) : pickRandom(ENCOURAGE)}
              </p>
              {!result.correct && (
                <p className="mt-1 text-sm">
                  Correct answer: <span className="font-semibold">{result.displayAnswer}</span>
                </p>
              )}
              <p className="mt-2 text-sm text-foreground/80">{result.explanation}</p>
            </div>
            <button
              type="button"
              onClick={next}
              data-testid="next-button"
              className="mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white"
            >
              {totalTarget && sessionTotal >= totalTarget ? "See results" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
