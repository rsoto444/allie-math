import type { DailySummary } from "@/lib/dailySummary";

function pct(n: number | null): string {
  return n === null ? "-" : `${Math.round(n * 100)}%`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function dailyEmailSubject(summary: DailySummary): string {
  const q = summary.practice.questionsAnswered;
  const mastered = summary.newlyMastered.length;
  if (q === 0) return "Allie's math update - no practice today";
  if (mastered > 0) return `Allie's math update - ${mastered} skill${mastered === 1 ? "" : "s"} mastered today`;
  return `Allie's math update - ${q} question${q === 1 ? "" : "s"} today`;
}

export function dailyEmailHtml(summary: DailySummary): string {
  const { practice, path, newlyMastered, checkups, masteryChecks, reviews, streakDays } = summary;

  const h3 = (t: string) => `<h3 style="margin:18px 0 6px; font-size:15px;">${t}</h3>`;
  const list = (items: string[], color = "#1f2333") =>
    `<ul style="font-size:14px; padding-left:20px; margin:0; color:${color};">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

  const nextStep =
    path.nextAction === "checkup"
      ? `Take the ${esc(path.grades.find((g) => g.grade === path.currentGrade)?.name ?? "next")} check-up`
      : path.nextAction === "mastery"
        ? `Mastery check is unlocked for <strong>${esc(path.currentSkill ?? "")}</strong>`
        : path.nextAction === "practice"
          ? `Practice <strong>${esc(path.currentSkill ?? "")}</strong> (${path.practiceStreak} of 5 in a row so far)`
          : "Everything is mastered - reviews only";

  const gradeRows = path.grades
    .map(
      (g) =>
        `<tr><td style="padding:3px 8px;">${esc(g.name)}</td><td style="padding:3px 8px; text-align:right;">${g.mastered}/${g.total}</td><td style="padding:3px 8px; color:#6b7086;">${g.checkupDone ? "check-up done" : "check-up not yet taken"}</td></tr>`
    )
    .join("");

  return `
<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2333;">
  <h2 style="color:#4340d6; margin-bottom:0;">Allie's Math - Daily Update</h2>
  <p style="color:#6b7086; margin-top:4px;">Last 24 hours</p>

  <div style="background:#eceaff; border-radius:12px; padding:16px; margin-bottom:8px;">
    <p style="margin:0; font-size:15px;"><strong>${practice.questionsAnswered}</strong> question${practice.questionsAnswered === 1 ? "" : "s"} answered${
      practice.questionsAnswered > 0 ? ` - <strong>${pct(practice.accuracy)}</strong> correct` : ""
    }</p>
    ${practice.questionsAnswered > 0 ? `<p style="margin:4px 0 0; font-size:13px; color:#6b7086;">About ${practice.minutesPracticedEstimate} minute${practice.minutesPracticedEstimate === 1 ? "" : "s"} of practice (rough estimate)</p>` : ""}
    ${streakDays > 0 ? `<p style="margin:4px 0 0; font-size:13px;">🔥 ${streakDays}-day practice streak</p>` : ""}
    <p style="margin:8px 0 0; font-size:14px;"><strong>Overall:</strong> ${path.masteredTotal} of ${path.skillTotal} skills mastered</p>
    <p style="margin:4px 0 0; font-size:14px;"><strong>Next step:</strong> ${nextStep}</p>
  </div>

  ${newlyMastered.length > 0 ? h3("🏆 Mastered today") + list(newlyMastered.map((m) => `${esc(m.name)} <span style="color:#6b7086;">(${m.via === "check" ? "passed the mastery check" : "3 of 3 on the check-up"})</span>`)) : ""}

  ${checkups
    .map(
      (c) =>
        h3(`🔍 ${esc(c.name)} check-up: ${c.correct}/${c.total}`) +
        (c.solid.length > 0 ? `<p style="margin:4px 0; font-size:13px; color:#17a673;">Already solid:</p>${list(c.solid.map(esc))}` : "") +
        (c.gaps.length > 0 ? `<p style="margin:8px 0 4px; font-size:13px; color:#b45309;">Gaps to work on (in this order):</p>${list(c.gaps.map(esc))}` : "")
    )
    .join("")}

  ${masteryChecks.length > 0 ? h3("Mastery checks") + list(masteryChecks.map((m) => `${esc(m.skill)}: ${m.correct}/${m.total} - ${m.passed ? "<strong>passed</strong>" : "not yet (needs 7/8)"}`)) : ""}

  ${reviews.length > 0 ? h3("Reviews") + list(reviews.map((r) => `${r.correct}/${r.total} on mastered skills`)) : ""}

  ${h3("Path by grade")}
  <table style="width:100%; border-collapse:collapse; font-size:14px;"><tbody>${gradeRows}</tbody></table>

  <p style="font-size:12px; color:#9297b8; margin-top:24px;">
    Sent automatically by Allie's Math Practice. Minutes practiced is an estimate, not a precise timer.
  </p>
</div>
`.trim();
}
