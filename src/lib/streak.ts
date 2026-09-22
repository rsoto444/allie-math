import { prisma } from "@/lib/prisma";

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Consecutive days (including today, or yesterday if today has no activity yet) with at least one attempt. */
export async function getStreakDays(): Promise<number> {
  const attempts = await prisma.attempt.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const days = new Set(attempts.map((a) => dateKey(a.createdAt)));

  const cursor = new Date();
  if (!days.has(dateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
