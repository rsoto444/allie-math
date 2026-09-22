import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { buildDailySummary } from "@/lib/dailySummary";

function secretsMatch(a: string | null, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest) {
  const provided = request.headers.get("x-report-secret");
  if (!secretsMatch(provided, process.env.REPORT_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const hours = Number(request.nextUrl.searchParams.get("hours")) || 24;
  const summary = await buildDailySummary(hours);
  return NextResponse.json(summary);
}
