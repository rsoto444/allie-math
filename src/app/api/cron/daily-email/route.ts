import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { buildDailySummary } from "@/lib/dailySummary";
import { dailyEmailHtml, dailyEmailSubject } from "@/lib/emailTemplate";
import { sendParentEmail } from "@/lib/mailer";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader && safeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return true;
  }

  const reportSecret = process.env.REPORT_SECRET;
  if (reportSecret) {
    const headerValue = request.headers.get("x-report-secret");
    if (headerValue && safeEqual(headerValue, reportSecret)) return true;

    // Query-param fallback so this can be tested by pasting a URL into a
    // browser - convenient for a personal family app, not meant as the
    // primary auth path (the header and the cron bearer token are).
    const queryValue = request.nextUrl.searchParams.get("secret");
    if (queryValue && safeEqual(queryValue, reportSecret)) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await buildDailySummary(24);
    await sendParentEmail(dailyEmailSubject(summary), dailyEmailHtml(summary));
    return NextResponse.json({ sent: true, summary });
  } catch (err) {
    console.error("daily-email failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    let databaseHost = "unset";
    try {
      databaseHost = new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
      databaseHost = "unparseable";
    }
    return NextResponse.json(
      { sent: false, error: message, debug: { databaseHost, hasAuthToken: !!process.env.DATABASE_AUTH_TOKEN } },
      { status: 500 }
    );
  }
}
