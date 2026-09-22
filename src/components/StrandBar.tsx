const COLOR_MAP: Record<string, { bg: string; text: string; bar: string }> = {
  sky: { bg: "bg-sky-100 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", bar: "bg-sky-500" },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  rose: { bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-500" },
};

export function StrandBar({
  name,
  color,
  accuracy,
  attempts,
}: {
  name: string;
  color: string;
  accuracy: number;
  attempts: number;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.sky;
  const pct = attempts > 0 ? Math.round(accuracy * 100) : null;

  return (
    <div className={`rounded-2xl p-4 ${c.bg}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-display text-sm font-bold ${c.text}`}>{name}</span>
        <span className="text-xs font-semibold text-muted">
          {pct === null ? "Not started" : `${pct}% correct`}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/30">
        <div
          className={`h-full rounded-full ${c.bar} transition-all`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}
