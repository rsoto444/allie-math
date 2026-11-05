// Sanity check for every question generator: runs each skill at every
// difficulty across many seeds and fails loudly on anything malformed.
// Run with: npx tsx scripts/check-generators.ts

import { SKILLS } from "../src/lib/curriculum";
import { GENERATORS } from "../src/lib/generators";
import { mulberry32, answersMatch } from "../src/lib/rng";

const SEEDS = 400;
const problems: string[] = [];

function bad(skill: string, difficulty: number, seed: number, msg: string, extra?: unknown) {
  problems.push(`${skill} d${difficulty} seed=${seed}: ${msg}${extra !== undefined ? ` ${JSON.stringify(extra)}` : ""}`);
}

for (const skill of SKILLS) {
  const gen = GENERATORS[skill.key];
  if (!gen) {
    problems.push(`${skill.key}: no generator registered`);
    continue;
  }
  for (const difficulty of [1, 2, 3] as const) {
    const seen = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      let q;
      try {
        q = gen(difficulty, mulberry32(seed));
        // regenerating with the same seed must give the identical question
        const again = gen(difficulty, mulberry32(seed));
        if (JSON.stringify(again) !== JSON.stringify(q)) bad(skill.key, difficulty, seed, "not deterministic");
      } catch (err) {
        bad(skill.key, difficulty, seed, `threw ${(err as Error).message}`);
        continue;
      }
      const text = `${q.prompt} ${q.displayAnswer} ${q.explanation} ${q.acceptableAnswers.join(" ")} ${(q.choices ?? []).join(" ")}`;
      if (/NaN|undefined|Infinity|null/.test(text)) bad(skill.key, difficulty, seed, "contains NaN/undefined", q);
      if (!q.prompt.trim()) bad(skill.key, difficulty, seed, "empty prompt");
      if (q.acceptableAnswers.length === 0) bad(skill.key, difficulty, seed, "no acceptable answers");
      if (!answersMatch(q.displayAnswer, q.acceptableAnswers, q.strict)) {
        bad(skill.key, difficulty, seed, "displayAnswer is not accepted", q);
      }
      if (q.type === "mc") {
        if (!q.choices || q.choices.length < 2) bad(skill.key, difficulty, seed, "mc without choices", q);
        else {
          if (new Set(q.choices).size !== q.choices.length) bad(skill.key, difficulty, seed, "duplicate choices", q.choices);
          const matching = q.choices.filter((c) => answersMatch(c, q.acceptableAnswers, q.strict));
          if (matching.length !== 1) bad(skill.key, difficulty, seed, `expected exactly 1 correct choice, got ${matching.length}`, q);
        }
      }
      seen.add(q.prompt + "|" + (q.choices ?? []).join(","));
    }
    if (seen.size < 8) problems.push(`${skill.key} d${difficulty}: only ${seen.size} distinct questions across ${SEEDS} seeds`);
  }
}

if (problems.length > 0) {
  console.error(`FAILED - ${problems.length} problem(s), showing up to 2 per skill/difficulty:`);
  const shown = new Map<string, number>();
  for (const p of problems) {
    const group = p.split(" seed=")[0];
    const n = shown.get(group) ?? 0;
    if (n < 2) console.error("  " + p);
    shown.set(group, n + 1);
  }
  process.exit(1);
}
console.log(`OK - ${SKILLS.length} skills x 3 difficulties x ${SEEDS} seeds, all well-formed.`);
