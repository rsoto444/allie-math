import { getProgressAction } from "@/lib/actions";
import { Nav } from "@/components/Nav";
import { GradeCard } from "@/components/PathView";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function ProgressPage() {
  const { path, totalAttemptsAllTime, recentSessions } = await getProgressAction();

  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/progress" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-1 font-display text-3xl font-bold">Your Progress</h1>
        <p className="mb-6 text-muted">
          {path.masteredTotal} of {path.skillTotal} skills mastered · {totalAttemptsAllTime} question
          {totalAttemptsAllTime === 1 ? "" : "s"} answered so far
        </p>

        <div className="mb-8 grid gap-3">
          {path.grades.map((g) => (
            <GradeCard key={g.grade} grade={g} expanded />
          ))}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Recent check-ups, mastery checks & reviews</h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted">Nothing finished yet - start with the Grade 3 check-up!</p>
          ) : (
            <ul className="divide-y divide-card-border">
              {recentSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-muted">{formatDate(s.finishedAt)}</span>
                  <span className="font-semibold">
                    {s.correctCount}/{s.totalQuestions}
                    {s.passed === true ? " ✅" : s.passed === false ? " ✗" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
