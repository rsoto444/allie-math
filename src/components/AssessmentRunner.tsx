"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  startAssessmentAction,
  finishAssessmentAction,
  type AssessmentSummary,
} from "@/lib/actions";
import { PracticeSession } from "@/components/PracticeSession";

export function AssessmentRunner({
  mode,
  title,
}: {
  mode: "quiz" | "test";
  title: string;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [summary, setSummary] = useState<AssessmentSummary | null>(null);

  useEffect(() => {
    startAssessmentAction(mode).then((res) => {
      setSessionId(res.sessionId);
      setTotalQuestions(res.totalQuestions);
    });
  }, [mode]);

  async function handleFinished() {
    if (!sessionId) return;
    const result = await finishAssessmentAction(sessionId);
    setSummary(result);
  }

  if (summary) {
    const pct = Math.round((summary.correctCount / summary.totalQuestions) * 100);
    return (
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-3xl border border-card-border bg-card p-8 text-center shadow-sm">
          <div className="text-5xl">{pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>
          <h2 className="mt-3 font-display text-2xl font-bold">
            {summary.correctCount} / {summary.totalQuestions} correct
          </h2>
          <p className="mt-1 text-muted">{pct}% on this {mode}</p>

          <div className="mt-6 space-y-2 text-left">
            {summary.breakdown.map((b) => (
              <div key={b.skillKey} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{b.skillName}</span>
                <span className="text-muted">
                  {b.correct}/{b.total}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="mt-6 inline-block w-full rounded-xl bg-brand py-3 font-semibold text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return <div className="py-16 text-center text-muted">Setting up your {title.toLowerCase()}...</div>;
  }

  return (
    <PracticeSession
      mode={mode}
      sessionId={sessionId}
      totalTarget={totalQuestions}
      onFinished={handleFinished}
    />
  );
}
