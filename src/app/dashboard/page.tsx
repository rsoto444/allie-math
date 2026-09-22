import Link from "next/link";
import { getProgressAction } from "@/lib/actions";
import { Nav } from "@/components/Nav";
import { StrandBar } from "@/components/StrandBar";

export default async function DashboardPage() {
  const progress = await getProgressAction();

  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/dashboard" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Hi Allie! 👋</h1>
            <p className="mt-1 text-muted">Ready for some math practice?</p>
          </div>
          {progress.streakDays > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-2 dark:bg-amber-950/40">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-display text-lg font-bold text-amber-700 dark:text-amber-300">
                  {progress.streakDays} day{progress.streakDays === 1 ? "" : "s"}
                </div>
                <div className="text-xs text-muted">practice streak</div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/practice"
            className="rounded-2xl bg-brand p-6 text-white shadow-sm transition-transform hover:scale-[1.02]"
          >
            <div className="text-3xl">✏️</div>
            <div className="mt-2 font-display text-xl font-bold">Practice</div>
            <div className="mt-1 text-sm text-white/80">Untimed, one question at a time</div>
          </Link>
          <Link
            href="/quiz"
            className="rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <div className="text-3xl">📝</div>
            <div className="mt-2 font-display text-xl font-bold">Take a Quiz</div>
            <div className="mt-1 text-sm text-muted">12 questions, quick check-in</div>
          </Link>
          <Link
            href="/test"
            className="rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <div className="text-3xl">🎯</div>
            <div className="mt-2 font-display text-xl font-bold">Weekly Test</div>
            <div className="mt-1 text-sm text-muted">20 questions, all topics</div>
          </Link>
        </div>

        {progress.weakest.length > 0 && (
          <div className="mb-8 rounded-2xl border border-card-border bg-card p-5">
            <h2 className="font-display text-lg font-bold">Keep an eye on these</h2>
            <p className="mb-3 text-sm text-muted">
              Practice sessions will bring you more questions on these topics automatically.
            </p>
            <ul className="space-y-1.5">
              {progress.weakest.map((w) => (
                <li key={w.key} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{w.name}</span>
                  <span className="text-muted">{Math.round(w.accuracy * 100)}% correct</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="mb-3 font-display text-lg font-bold">Your topics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
      </main>
    </div>
  );
}
