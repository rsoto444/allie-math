"use client";

import { useState } from "react";
import type { AnswerResult, QuestionPayload } from "@/lib/actions";

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

export function QuestionCard({
  question,
  result,
  isPending,
  onSubmit,
  onNext,
  nextLabel,
  hideFeedbackDetails,
}: {
  question: QuestionPayload;
  result: AnswerResult | null;
  isPending: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  nextLabel: string;
  /** Check-ups and mastery checks show right/wrong only, not the worked answer. */
  hideFeedbackDetails?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [headline] = useState(() => ({ praise: pickRandom(PRAISE), encourage: pickRandom(ENCOURAGE) }));

  return (
    <div
      className="rounded-3xl border border-card-border bg-card p-6 shadow-sm"
      data-testid="question-card"
      data-question-key={`${question.skillKey}:${question.seed}`}
      data-difficulty={question.difficulty}
    >
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
              onClick={() => onSubmit(choice)}
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
            if (answer.trim() !== "") onSubmit(answer);
          }}
        >
          <input
            autoFocus
            type="text"
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
          <div className={`rounded-2xl p-4 ${result.correct ? "bg-success-soft" : "bg-danger-soft"}`}>
            <p className={`font-display text-lg font-bold ${result.correct ? "text-success" : "text-danger"}`}>
              {result.correct ? headline.praise : hideFeedbackDetails ? "Not this time." : headline.encourage}
            </p>
            {!hideFeedbackDetails && !result.correct && (
              <p className="mt-1 text-sm">
                Correct answer: <span className="font-semibold">{result.displayAnswer}</span>
              </p>
            )}
            {!hideFeedbackDetails && <p className="mt-2 text-sm text-foreground/80">{result.explanation}</p>}
          </div>
          <button
            type="button"
            onClick={onNext}
            data-testid="next-button"
            className="mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
