import { getProgressAction } from "@/lib/actions";
import { Nav } from "@/components/Nav";
import { StrandBar } from "@/components/StrandBar";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function ProgressPage() {
  const progress = await getProgressAction();

  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/progress" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-1 font-display text-3xl font-bold">Your Progress</h1>
        <p className="mb-6 text-muted">
          {progress.totalAttemptsAllTime} question{progress.totalAttemptsAllTime === 1 ? "" : "s"}{" "}
          answered so far
        </p>

        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {progress.strands.map((s) => (
            <StrandBar
              key={s.key}
              name={s.name}
              color={s.color}
              accuracy={s.accuracy}
              attempts={s.attempts}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Recent quizzes & tests</h2>
          {progress.recentAssessments.length === 0 ? (
            <p className="text-sm text-muted">
              No quizzes or tests taken yet - try one from the dashboard!
            </p>
          ) : (
            <ul className="divide-y divide-card-border">
              {progress.recentAssessments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold capitalize">{a.mode}</span>
                  <span className="text-muted">
                    {a.finishedAt ? formatDate(a.finishedAt) : formatDate(a.startedAt)}
                  </span>
                  <span className="font-semibold">
                    {a.correctCount}/{a.totalQuestions}
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
