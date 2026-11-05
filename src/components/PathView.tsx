import Link from "next/link";
import type { GradeState } from "@/lib/path";

const COLOR_MAP: Record<string, { bg: string; text: string; bar: string }> = {
  sky: { bg: "bg-sky-100 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", bar: "bg-sky-500" },
  violet: { bg: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", bar: "bg-violet-500" },
  amber: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" },
};

export function GradeCard({ grade, expanded }: { grade: GradeState; expanded: boolean }) {
  const c = COLOR_MAP[grade.color] ?? COLOR_MAP.sky;
  const pct = Math.round((grade.masteredCount / grade.total) * 100);
  const diag = grade.diagnostic;

  return (
    <div className={`rounded-2xl p-4 ${c.bg}`} data-testid={`grade-card-${grade.grade}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className={`font-display text-base font-bold ${c.text}`}>{grade.name}</span>
        <span className="text-xs font-semibold text-muted">
          {grade.masteredCount} / {grade.total} mastered
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/30">
        <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 text-sm">
        {diag.status === "done" && (
          <span className="text-muted">
            Check-up done: {diag.correct}/{diag.total}
          </span>
        )}
        {diag.status === "in_progress" && (
          <Link href={`/checkup/${grade.grade}`} className="font-semibold text-brand-dark underline">
            Continue check-up ({diag.answered}/{diag.total} done)
          </Link>
        )}
        {diag.status === "available" && (
          <Link href={`/checkup/${grade.grade}`} className="font-semibold text-brand-dark underline">
            Take the check-up
          </Link>
        )}
        {diag.status === "locked" && <span className="text-muted">Check-up unlocks after the previous grade&apos;s.</span>}
      </div>

      {expanded && (
        <ul className="mt-3 space-y-1 text-sm">
          {grade.skills.map((s) => (
            <li key={s.key} className="flex items-center gap-2" data-testid={`skill-${s.key}`} data-status={s.status}>
              <span className="w-5 text-center">
                {s.status === "mastered" ? "✅" : s.status === "current" ? "▶️" : "🔒"}
              </span>
              <span className={s.status === "locked" ? "text-muted" : s.status === "current" ? "font-bold" : ""}>
                {s.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
