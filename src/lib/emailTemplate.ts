import type { DailySummary } from "@/lib/dailySummary";

function pct(n: number | null): string {
  return n === null ? "-" : `${Math.round(n * 100)}%`;
}

export function dailyEmailSubject(summary: DailySummary): string {
  const { questionsAnswered } = summary.practice;
  if (questionsAnswered === 0) return "Allie's math update - no practice yet today";
  return `Allie's math update - ${questionsAnswered} question${questionsAnswered === 1 ? "" : "s"} today`;
}

export function dailyEmailHtml(summary: DailySummary): string {
  const { practice, byStrand, assessments, weakestAreasAllTime, streakDays } = summary;

  const strandRows = byStrand
    .map(
      (s) =>
        `<tr><td style="padding:4px 8px;">${s.strand}</td><td style="padding:4px 8px;text-align:right;">${s.correct}/${s.total}</td><td style="padding:4px 8px;text-align:right;">${pct(s.accuracy)}</td></tr>`
    )
    .join("");

  const assessmentRows = assessments
    .map(
      (a) =>
        `<li>${a.mode === "quiz" ? "Quiz" : "Weekly test"}: ${a.correct}/${a.total} correct</li>`
    )
    .join("");

  const weakestRows = weakestAreasAllTime
    .map((w) => `<li>${w.name} - ${Math.round(w.accuracy * 100)}% correct over ${w.attempts} recent tries</li>`)
    .join("");

  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2333;">
  <h2 style="color:#4340d6;">Allie's Math Practice - Daily Update</h2>
  <p style="color:#6b7086; margin-top:-8px;">Last 24 hours</p>

  <div style="background:#eceaff; border-radius:12px; padding:16px; margin-bottom:16px;">
    <p style="margin:0; font-size:15px;"><strong>${practice.questionsAnswered}</strong> question${practice.questionsAnswered === 1 ? "" : "s"} answered
      ${practice.questionsAnswered > 0 ? `- <strong>${pct(practice.accuracy)}</strong> correct` : ""}</p>
    ${practice.questionsAnswered > 0 ? `<p style="margin:4px 0 0; font-size:13px; color:#6b7086;">About ${practice.minutesPracticedEstimate} minute${practice.minutesPracticedEstimate === 1 ? "" : "s"} of practice (rough estimate)</p>` : ""}
    ${streakDays > 0 ? `<p style="margin:4px 0 0; font-size:13px;">🔥 ${streakDays}-day practice streak</p>` : ""}
  </div>

  ${
    byStrand.length > 0
      ? `<h3 style="margin-bottom:4px;">By topic (today)</h3>
  <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:16px;">
    <tbody>${strandRows}</tbody>
  </table>`
      : `<p style="color:#6b7086;">No practice questions answered in the last 24 hours.</p>`
  }

  ${
    assessments.length > 0
      ? `<h3 style="margin-bottom:4px;">Quizzes & tests (today)</h3>
  <ul style="font-size:14px; padding-left:20px;">${assessmentRows}</ul>`
      : ""
  }

  ${
    weakestRows
      ? `<h3 style="margin-bottom:4px;">Keep an eye on</h3>
  <ul style="font-size:14px; padding-left:20px; color:#6b7086;">${weakestRows}</ul>`
      : ""
  }

  <p style="font-size:12px; color:#9297b8; margin-top:24px;">
    Sent automatically by Allie's Math Practice. Minutes practiced is an estimate, not a precise timer.
  </p>
</div>
`.trim();
}
