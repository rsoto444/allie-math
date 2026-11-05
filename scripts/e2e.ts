// End-to-end test of the mastery path against a running dev server on :3000
// with a FRESH database. It knows the answers because questions are generated
// deterministically from (skillKey, difficulty, seed), which the page exposes.
//
//   rm -f dev.db && npx prisma migrate deploy && npm run dev   (in another shell)
//   npx tsx scripts/e2e.ts
//
// Reads APP_PIN and REPORT_SECRET from .env (the same values the dev server uses).

import "dotenv/config";
import { chromium, type Page } from "playwright";
import { GENERATORS } from "../src/lib/generators";
import { mulberry32, answersMatch } from "../src/lib/rng";

const BASE = "http://localhost:3000";
const PIN = (process.env.APP_PIN ?? "1234").split("");
const REPORT_SECRET = process.env.REPORT_SECRET;
if (!REPORT_SECRET) throw new Error("REPORT_SECRET must be set (it's read from .env)");

const log = (msg: string) => console.log(`[e2e] ${msg}`);
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
}

async function currentQuestion(page: Page) {
  const card = page.locator('[data-testid="question-card"]');
  await card.waitFor({ timeout: 15000 });
  const key = (await card.getAttribute("data-question-key"))!;
  const difficulty = Number(await card.getAttribute("data-difficulty")) as 1 | 2 | 3;
  const [skillKey, seedStr] = key.split(":");
  const generated = GENERATORS[skillKey](difficulty, mulberry32(Number(seedStr)));
  return { key, skillKey, difficulty, generated };
}

/** Answers the current question right or wrong, then clicks Next. Returns the question key. */
async function answer(page: Page, correctly: boolean): Promise<string> {
  const q = await currentQuestion(page);
  const mc = page.locator('[data-testid="mc-choice"]');
  if ((await mc.count()) > 0) {
    const texts = await mc.allTextContents();
    const idx = texts.findIndex((t: string) => answersMatch(t, q.generated.acceptableAnswers, q.generated.strict) === correctly);
    assert(idx >= 0, `no ${correctly ? "correct" : "wrong"} choice for ${q.key}: ${texts.join("|")}`);
    await mc.nth(idx).click();
  } else {
    const value = correctly ? q.generated.displayAnswer : "-999999";
    await page.fill('[data-testid="answer-input"]', value);
    await page.click('[data-testid="check-button"]');
  }
  const feedback = page.locator('[data-testid="feedback"]');
  await feedback.waitFor({ timeout: 15000 });
  const text = (await feedback.textContent()) ?? "";
  const gotCorrect = !/Not this time|Not quite|So close|Good try|Almost/.test(text);
  assert(gotCorrect === correctly, `expected ${correctly ? "correct" : "wrong"} feedback for ${q.key}, got: ${text.slice(0, 80)}`);
  await page.click('[data-testid="next-button"]');
  return q.key;
}

async function waitForNewQuestion(page: Page, prevKey: string) {
  await page.waitForFunction(
    (prev: string) => {
      const el = document.querySelector('[data-testid="question-card"]');
      return !!el && el.getAttribute("data-question-key") !== prev;
    },
    prevKey,
    { timeout: 15000 }
  );
}

async function runSession(page: Page, decide: (skillKey: string, n: number) => boolean) {
  let n = 0;
  for (;;) {
    const summary = page.locator('[data-testid="session-summary"]');
    const card = page.locator('[data-testid="question-card"]');
    await Promise.race([summary.waitFor({ timeout: 20000 }), card.waitFor({ timeout: 20000 })]);
    if (await summary.isVisible()) return n;
    const { skillKey } = await currentQuestion(page);
    const key = await answer(page, decide(skillKey, n));
    n++;
    await Promise.race([
      waitForNewQuestion(page, key),
      page.locator('[data-testid="session-summary"]').waitFor({ timeout: 20000 }),
    ]);
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();
  page.on("pageerror", (err: Error) => console.log("[pageerror]", err.message));

  // ---- login
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  assert(page.url().endsWith("/login"), "root redirects to login");
  for (const d of PIN) await page.click(`button:has-text("${d}")`);
  await page.waitForURL("**/dashboard");
  log("logged in");

  // ---- fresh state: grade 3 check-up is the next action; practice is blocked
  await page.locator('[data-testid="hero-checkup"]').waitFor();
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  assert(page.url().endsWith("/dashboard"), "practice redirects to dashboard before the check-up");
  log("practice locked until check-up - OK");

  // ---- grade 3 check-up: ace multiplication + division facts, miss the rest; resume midway
  const ace = new Set(["g3_mult_facts", "g3_div_facts"]);
  await page.goto(`${BASE}/checkup/3`, { waitUntil: "networkidle" });
  let answered = 0;
  for (let i = 0; i < 5; i++) {
    const { skillKey } = await currentQuestion(page);
    const key = await answer(page, ace.has(skillKey));
    answered++;
    await waitForNewQuestion(page, key);
  }
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const heroText = await page.locator('[data-testid="hero-checkup"]').textContent();
  assert(heroText?.includes("Continue") && heroText.includes("5 of 24"), `resume shown on dashboard: ${heroText}`);
  log("check-up resumes (5 of 24) - OK");

  await page.goto(`${BASE}/checkup/3`, { waitUntil: "networkidle" });
  const progress = await page.locator('[data-testid="session-progress"]').textContent();
  assert(progress?.includes("Question 6 of 24"), `resumed at question 6: ${progress}`);
  answered += await runSession(page, (skillKey) => ace.has(skillKey));
  assert(answered === 24, `answered all 24, got ${answered}`);
  const summaryText = (await page.locator('[data-testid="session-summary"]').textContent()) ?? "";
  assert(summaryText.includes("Multiplication facts") && summaryText.includes("Division facts"), "aced skills listed as solid");
  assert(summaryText.includes("To work on"), "gaps listed");
  log("grade 3 check-up: 2 skills mastered via 3/3, 6 gaps - OK");

  // ---- path: current skill is the first unmastered (add/subtract), mult/div marked mastered
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const hero = await page.locator('[data-testid="hero-practice"]').textContent();
  assert(hero?.includes("Adding & subtracting with regrouping"), `current skill is add/sub: ${hero}`);
  assert((await page.locator('[data-testid="skill-g3_mult_facts"]').getAttribute("data-status")) === "mastered", "mult facts mastered");
  assert((await page.locator('[data-testid="skill-g3_place_value_round"]').getAttribute("data-status")) === "locked", "place value locked");
  log("dashboard path state - OK");

  // ---- practice: 5 in a row unlocks the mastery check (a miss in the middle resets it)
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  let key = await answer(page, true);
  await waitForNewQuestion(page, key);
  key = await answer(page, true);
  await waitForNewQuestion(page, key);
  key = await answer(page, false);
  await waitForNewQuestion(page, key);
  assert((await page.locator('[data-testid="streak-count"]').textContent())?.trim() === "0 / 5", "miss resets streak");
  for (let i = 0; i < 5; i++) {
    key = await answer(page, true);
    await waitForNewQuestion(page, key);
  }
  assert((await page.locator('[data-testid="streak-count"]').textContent())?.trim() === "5 / 5", "5 in a row");
  await page.locator('[data-testid="mastery-link"]').waitFor();
  log("practice streak unlocks mastery check - OK");

  // ---- mastery check: pass with 7/8 (one deliberate miss)
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="hero-mastery"]').waitFor();
  await page.goto(`${BASE}/mastery`, { waitUntil: "networkidle" });
  const n1 = await runSession(page, (_s, n) => n !== 3);
  assert(n1 === 8, `mastery check has 8 questions, got ${n1}`);
  assert((await page.locator('[data-testid="session-summary"]').textContent())?.includes("Mastered!"), "7/8 passes");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  assert((await page.locator('[data-testid="skill-g3_add_sub_regroup"]').getAttribute("data-status")) === "mastered", "add/sub now mastered");
  assert((await page.locator('[data-testid="skill-g3_place_value_round"]').getAttribute("data-status")) === "current", "place value is now current");
  log("mastery check pass advances the path - OK");

  // ---- mastery check: fail with 6/8, path does not advance, streak needs rebuilding
  await page.goto(`${BASE}/practice`, { waitUntil: "networkidle" });
  for (let i = 0; i < 5; i++) {
    key = await answer(page, true);
    await waitForNewQuestion(page, key);
  }
  await page.goto(`${BASE}/mastery`, { waitUntil: "networkidle" });
  await runSession(page, (_s, n) => n !== 1 && n !== 2);
  assert((await page.locator('[data-testid="session-summary"]').textContent())?.includes("Not yet"), "6/8 fails");
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  assert((await page.locator('[data-testid="skill-g3_place_value_round"]').getAttribute("data-status")) === "current", "still current after fail");
  const heroAfterFail = await page.locator('[data-testid="hero-practice"]').textContent();
  assert(heroAfterFail?.includes("0 of 5"), `streak reset after failed check: ${heroAfterFail}`);
  log("mastery check fail keeps the gate closed - OK");

  // ---- review draws only from mastered skills
  await page.goto(`${BASE}/review`, { waitUntil: "networkidle" });
  const masteredKeys = new Set(["g3_mult_facts", "g3_div_facts", "g3_add_sub_regroup"]);
  const n2 = await runSession(page, (skillKey) => {
    assert(masteredKeys.has(skillKey), `review question from unmastered skill: ${skillKey}`);
    return true;
  });
  assert(n2 === 10, `review has 10 questions, got ${n2}`);
  log("review uses mastered skills only - OK");

  // ---- progress page + daily summary
  await page.goto(`${BASE}/progress`, { waitUntil: "networkidle" });
  const prog = (await page.locator("main").textContent()) ?? "";
  assert(prog.includes("3 of 49 skills mastered"), `progress header: ${prog.slice(0, 120)}`);
  assert(prog.includes("Grade 3 foundations check-up") && prog.includes("Mastery check:"), "history lists sessions");

  const res = await page.request.get(`${BASE}/api/daily-summary`, { headers: { "x-report-secret": REPORT_SECRET } });
  assert(res.status() === 200, "daily summary 200");
  const summary = await res.json();
  assert(summary.newlyMastered.length === 3, `3 newly mastered, got ${summary.newlyMastered.length}`);
  assert(summary.checkups.length === 1 && summary.checkups[0].gaps.length === 6, "check-up with 6 gaps in summary");
  assert(summary.masteryChecks.length === 2 && summary.masteryChecks[0].passed && !summary.masteryChecks[1].passed, "both mastery checks reported");
  assert(summary.path.currentSkill === "Place value & rounding to tens and hundreds", `current skill in summary: ${summary.path.currentSkill}`);
  log("progress page + daily summary - OK");

  await page.click('button:has-text("Log out")');
  await page.waitForURL("**/login");
  await browser.close();
  log("ALL E2E CHECKS PASSED");
})().catch((err) => {
  console.error("[e2e FAILED]", err);
  process.exit(1);
});
