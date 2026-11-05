import Link from "next/link";
import { getProgressAction } from "@/lib/actions";
import { Nav } from "@/components/Nav";
import { GradeCard } from "@/components/PathView";
import { gradeMeta } from "@/lib/curriculum";
import { PRACTICE_STREAK_TO_UNLOCK } from "@/lib/rules";

export default async function DashboardPage() {
  const { path, streakDays } = await getProgressAction();

  let hero: { href: string; emoji: string; title: string; body: string; testId: string };
  if (path.nextAction === "checkup" && path.checkupGrade) {
    const g = path.grades.find((x) => x.grade === path.checkupGrade)!;
    const resuming = g.diagnostic.status === "in_progress";
    hero = {
      href: `/checkup/${path.checkupGrade}`,
      emoji: "🔍",
      title: resuming ? `Continue the ${gradeMeta(path.checkupGrade).name} check-up` : `Take the ${gradeMeta(path.checkupGrade).name} check-up`,
      body: resuming
        ? `${g.diagnostic.answered} of ${g.diagnostic.total} done. This finds out what you already know.`
        : `${g.diagnostic.total ?? g.total * 3} questions. Anything you already know gets checked off - the rest becomes your practice list.`,
      testId: "hero-checkup",
    };
  } else if (path.nextAction === "mastery" && path.current) {
    hero = {
      href: "/mastery",
      emoji: "🏆",
      title: "Mastery Check unlocked!",
      body: `${path.current.name}. 8 questions, get 7 right to move on.`,
      testId: "hero-mastery",
    };
  } else if (path.nextAction === "practice" && path.current) {
    hero = {
      href: "/practice",
      emoji: "✏️",
      title: `Practice: ${path.current.name}`,
      body: `${path.practiceStreak} of ${PRACTICE_STREAK_TO_UNLOCK} in a row so far. Get ${PRACTICE_STREAK_TO_UNLOCK} in a row to unlock the Mastery Check.`,
      testId: "hero-practice",
    };
  } else {
    hero = {
      href: "/review",
      emoji: "🎉",
      title: "Every skill mastered!",
      body: "Keep things sharp with a review.",
      testId: "hero-done",
    };
  }

  const currentGrade = path.current?.grade ?? 6;

  return (
    <div className="flex flex-1 flex-col">
      <Nav active="/dashboard" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Hi Allie! 👋</h1>
            <p className="mt-1 text-muted">
              {path.masteredTotal} of {path.skillTotal} skills mastered
            </p>
          </div>
          {streakDays > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-2 dark:bg-amber-950/40">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-display text-lg font-bold text-amber-700 dark:text-amber-300">
                  {streakDays} day{streakDays === 1 ? "" : "s"}
                </div>
                <div className="text-xs text-muted">practice streak</div>
              </div>
            </div>
          )}
        </div>

        <Link
          href={hero.href}
          data-testid={hero.testId}
          className="mb-4 block rounded-3xl bg-brand p-6 text-white shadow-sm transition-transform hover:scale-[1.01]"
        >
          <div className="text-3xl">{hero.emoji}</div>
          <div className="mt-2 font-display text-2xl font-bold">{hero.title}</div>
          <div className="mt-1 text-sm text-white/85">{hero.body}</div>
          <div className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">Start →</div>
        </Link>

        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {path.nextAction === "mastery" && (
            <Link
              href="/practice"
              className="rounded-2xl border border-card-border bg-card p-4 shadow-sm transition-transform hover:scale-[1.02]"
            >
              <div className="font-display text-lg font-bold">✏️ Keep practicing</div>
              <div className="mt-1 text-sm text-muted">Warm up a bit more before the check.</div>
            </Link>
          )}
          <Link
            href={path.reviewAvailable ? "/review" : "#"}
            aria-disabled={!path.reviewAvailable}
            className={`rounded-2xl border border-card-border bg-card p-4 shadow-sm transition-transform ${
              path.reviewAvailable ? "hover:scale-[1.02]" : "opacity-50"
            }`}
          >
            <div className="font-display text-lg font-bold">🔁 Review</div>
            <div className="mt-1 text-sm text-muted">
              {path.reviewAvailable
                ? "10 quick questions from skills you've already mastered."
                : "Unlocks once you've mastered 3 skills."}
            </div>
          </Link>
        </div>

        <h2 className="mb-3 font-display text-lg font-bold">Your path</h2>
        <div className="grid gap-3">
          {path.grades.map((g) => (
            <GradeCard key={g.grade} grade={g} expanded={g.grade === currentGrade} />
          ))}
        </div>
      </main>
    </div>
  );
}
