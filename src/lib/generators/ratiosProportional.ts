import { randInt, pick, gcd, makeChoices } from "@/lib/rng";
import type { Generator } from "./types";

const THINGS: [string, string][] = [
  ["red marbles", "blue marbles"],
  ["dogs", "cats"],
  ["basketballs", "soccer balls"],
  ["boys", "girls"],
  ["pencils", "pens"],
  ["apples", "oranges"],
  ["stickers", "cards"],
];

export const rp_ratio_simplify: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? [2, 12] : difficulty === 2 ? [6, 30] : [12, 60];
  let a = randInt(rng, range[0], range[1]);
  let b = randInt(rng, range[0], range[1]);
  // force a common factor so it actually simplifies
  const k = randInt(rng, 2, 5);
  a = a - (a % k) + k;
  b = b - (b % k) + k;
  const [thingA, thingB] = pick(rng, THINGS);
  const d = gcd(a, b);
  const answer = `${a / d}:${b / d}`;
  const choices = makeChoices(rng, answer, [
    `${a}:${b}`,
    `${a / d}:${b}`,
    `${b / d}:${a / d}`,
  ]);
  return {
    prompt: `There are ${a} ${thingA} and ${b} ${thingB}. Write the ratio of ${thingA} to ${thingB} in simplest form.`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices,
    explanation: `Divide both numbers by their greatest common factor (${d}): ${a}÷${d} : ${b}÷${d} = ${answer}.`,
  };
};

export const rp_unit_rate: Generator = (difficulty, rng) => {
  const rate = randInt(rng, difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4, difficulty === 3 ? 18 : 12);
  const hours = randInt(rng, 2, difficulty === 1 ? 5 : 8);
  const total = rate * hours;
  const scenarios: [string, string, string][] = [
    ["A car travels", "miles", "hours"],
    ["A runner covers", "miles", "hours"],
    ["A printer prints", "pages", "minutes"],
    ["A factory makes", "toys", "hours"],
  ];
  const [verb, unit, timeUnit] = pick(rng, scenarios);
  const answer = `${rate}`;
  return {
    prompt: `${verb} ${total} ${unit} in ${hours} ${timeUnit}. What is the unit rate in ${unit} per ${timeUnit.replace(/s$/, "")}?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Divide the total by the time: ${total} ÷ ${hours} = ${rate} ${unit} per ${timeUnit.replace(/s$/, "")}.`,
  };
};

export const rp_equivalent_ratios: Generator = (difficulty, rng) => {
  const a = randInt(rng, 2, difficulty === 1 ? 6 : 9);
  const b = randInt(rng, 2, difficulty === 1 ? 6 : 9);
  const k = randInt(rng, 2, difficulty === 3 ? 9 : 6);
  const missingIsSecondPair = rng() < 0.5;
  const c = a * k;
  const d = b * k;
  const answer = String(missingIsSecondPair ? d : c);
  const shown = missingIsSecondPair ? `${a}:${b} = ${c}:?` : `${a}:${b} = ?:${d}`;
  return {
    prompt: `The ratios are equivalent. What number goes in place of the "?"\n${shown}`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `${a}:${b} is scaled up by ${k} (multiply both numbers by ${k}) to get ${c}:${d}.`,
  };
};

const PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];

export const rp_percent_of_number: Generator = (difficulty, rng) => {
  const percent = pick(rng, PERCENTS);
  let base: number;
  if (difficulty === 1) {
    // keep it a clean whole-number answer
    const multiplesNeeded = 100 / gcd(percent, 100);
    base = multiplesNeeded * randInt(rng, 1, 4);
  } else if (difficulty === 2) {
    base = randInt(rng, 10, 200);
  } else {
    base = randInt(rng, 10, 500);
  }
  const raw = (percent / 100) * base;
  const rounded = Math.round(raw * 100) / 100;
  const answer = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return {
    prompt: `What is ${percent}% of ${base}?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `${percent}% means ${percent}/100. ${percent}/100 × ${base} = ${answer}.`,
  };
};
