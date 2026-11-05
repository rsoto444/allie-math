"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  getSessionQuestionAction,
  submitAnswerAction,
  finishSessionAction,
  type AnswerResult,
  type QuestionPayload,
  type SessionStart,
  type SessionSummary,
} from "@/lib/actions";
import { QuestionCard } from "@/components/QuestionCard";

export function SessionRunner({
  start,
  onStart,
}: {
  /** Already-started session, or a function that starts (or resumes) one. */
  start: SessionStart | null;
  onStart?: () => Promise<SessionStart>;
}) {
  const [session, setSession] = useState<SessionStart | null>(start);
  const [question, setQuestion] = useState<QuestionPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(start?.totalQuestions ?? 0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadQuestion(sessionId: string) {
    startTransition(async () => {
      const next = await getSessionQuestionAction(sessionId);
      setIndex(next.index);
      setTotal(next.total);
      if (next.question) {
        setQuestion(next.question);
      } else {
        const done = await finishSessionAction(sessionId);
        setSummary(done);
      }
    });
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = session ?? (onStart ? await onStart() : null);
        if (!active) return;
        if (!s) throw new Error("No session");
        setSession(s);
        loadQuestion(s.sessionId);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(userAnswer: string) {
    if (!question || !session) return;
    startTransition(async () => {
      const res = await submitAnswerAction({
        skillKey: question.skillKey,
        difficulty: question.difficulty,
        seed: question.seed,
        mode: session.mode,
        sessionId: session.sessionId,
        userAnswer,
      });
      setResult(res);
    });
  }

  function next() {
    if (!session) return;
    setResult(null);
    setQuestion(null);
    loadQuestion(session.sessionId);
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-card-border bg-card p-8 text-center">
        <p className="font-semibold text-danger">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white">
          Back to home
        </Link>
      </div>
    );
  }

  if (summary) return <SummaryView summary={summary} />;

  if (!session || !question) {
    return <div className="py-16 text-center text-muted">Loading...</div>;
  }

  const hideDetails = session.mode !== "review";
  const isLast = index + 1 >= total;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand-dark">{session.title}</span>
        <span className="text-muted" data-testid="session-progress">
          Question {index + 1} of {total}
        </span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-card-border">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(index / total) * 100}%` }} />
      </div>
      <QuestionCard
        key={`${question.skillKey}:${question.seed}`}
        question={question}
        result={result}
        isPending={isPending}
        onSubmit={submit}
        onNext={next}
        nextLabel={isLast ? "See results" : "Next question →"}
        hideFeedbackDetails={hideDetails}
      />
      {session.mode === "diagnostic" && (
        <p className="mt-4 text-center text-xs text-muted">
          You can stop any time - your place is saved and you can pick up where you left off.
        </p>
      )}
    </div>
  );
}

function SummaryView({ summary }: { summary: SessionSummary }) {
  const pct = Math.round((summary.correctCount / summary.totalQuestions) * 100);

  if (summary.mode === "mastery") {
    return (
      <div className="mx-auto w-full max-w-xl" data-testid="session-summary">
        <div className="rounded-3xl border border-card-border bg-card p-8 text-center shadow-sm">
          <div className="text-5xl">{summary.passed ? "🏆" : "💪"}</div>
          <h2 className="mt-3 font-display text-2xl font-bold">
            {summary.passed ? "Mastered!" : "Not yet - keep going!"}
          </h2>
          <p className="mt-1 text-muted">
            {summary.correctCount} / {summary.totalQuestions} on {summary.skillName}
          </p>
          <p className="mt-4 text-sm text-foreground/80">
            {summary.passed
              ? "You've proven this skill. The next one on your path is unlocked."
              : "You need 7 out of 8. Head back to practice, get 5 in a row again, and try the check once more."}
          </p>
          <Link
            href={summary.passed ? "/dashboard" : "/practice"}
            className="mt-6 inline-block w-full rounded-xl bg-brand py-3 font-semibold text-white"
          >
            {summary.passed ? "See your path" : "Back to practice"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl" data-testid="session-summary">
      <div className="rounded-3xl border border-card-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</div>
          <h2 className="mt-3 font-display text-2xl font-bold">
            {summary.correctCount} / {summary.totalQuestions} correct
          </h2>
          <p className="mt-1 text-muted">
            {summary.mode === "diagnostic"
              ? "Here's what the check-up found."
              : `${pct}% on this review.`}
          </p>
        </div>

        {summary.mode === "diagnostic" && (
          <div className="mt-6 space-y-5">
            {summary.newlyMastered.length > 0 && (
              <div>
                <h3 className="mb-2 font-display font-bold text-success">Already solid (3 of 3)</h3>
                <ul className="space-y-1 text-sm">
                  {summary.newlyMastered.map((n) => (
                    <li key={n}>✓ {n}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.gaps.length > 0 && (
              <div>
                <h3 className="mb-2 font-display font-bold text-amber-600 dark:text-amber-300">To work on</h3>
                <ul className="space-y-1 text-sm">
                  {summary.breakdown
                    .filter((b) => !b.mastered)
                    .map((b) => (
                      <li key={b.skillKey} className="flex justify-between">
                        <span>{b.skillName}</span>
                        <span className="text-muted">
                          {b.correct}/{b.total}
                        </span>
                      </li>
                    ))}
                </ul>
                <p className="mt-2 text-xs text-muted">Practice will take these one at a time, in order.</p>
              </div>
            )}
          </div>
        )}

        {summary.mode === "review" && (
          <ul className="mt-6 space-y-1.5 text-sm">
            {summary.breakdown.map((b) => (
              <li key={b.skillKey} className="flex justify-between">
                <span>{b.skillName}</span>
                <span className="text-muted">
                  {b.correct}/{b.total}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link href="/dashboard" className="mt-6 inline-block w-full rounded-xl bg-brand py-3 text-center font-semibold text-white">
          Back to home
        </Link>
      </div>
    </div>
  );
}
