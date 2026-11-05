import { randInt, pick, makeChoices, formatFraction, formatMixed, formatRemainder, gcd } from "@/lib/rng";
import type { Generator } from "./types";

const NAMES = ["Mia", "Jake", "Sofia", "Liam", "Ava", "Noah", "Ellie", "Max"];

function withCommas(n: number): string {
  return n.toLocaleString("en-US");
}

export const g4_place_value_large: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const n = randInt(rng, 1001, 99999);
    const answer = String(Math.round(n / 1000) * 1000);
    return {
      prompt: `Round ${withCommas(n)} to the nearest thousand.`,
      type: "numeric",
      acceptableAnswers: [answer, withCommas(Number(answer))],
      displayAnswer: withCommas(Number(answer)),
      explanation: `Look at the hundreds digit (${Math.floor((n % 1000) / 100)}). 5 or more rounds up, 4 or less rounds down. ${withCommas(n)} rounds to ${withCommas(Number(answer))}.`,
    };
  }
  if (difficulty === 2) {
    const a = randInt(rng, 10000, 999999);
    let b = a + randInt(rng, -5000, 5000);
    if (b === a) b += 7;
    const answer = a > b ? ">" : "<";
    return {
      prompt: `Which symbol makes this true?\n${withCommas(a)} ___ ${withCommas(b)}`,
      type: "mc",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      choices: ["<", ">", "="],
      explanation: `Compare digit by digit from the left. The first place where they differ decides it. ${withCommas(a)} ${answer} ${withCommas(b)}.`,
    };
  }
  const n = randInt(rng, 100000, 999999);
  const places = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"];
  const idx = randInt(rng, 2, 5);
  const digit = Math.floor(n / 10 ** idx) % 10;
  const value = digit * 10 ** idx;
  const answer = String(value);
  return {
    prompt: `What is the value of the digit ${digit} in ${withCommas(n)}? (It's in the ${places[idx]} place.)`,
    type: "numeric",
    acceptableAnswers: [answer, withCommas(value)],
    displayAnswer: withCommas(value),
    explanation: `A ${digit} in the ${places[idx]} place is worth ${digit} × ${withCommas(10 ** idx)} = ${withCommas(value)}.`,
  };
};

export const g4_multi_digit_mult: Generator = (difficulty, rng) => {
  const a = difficulty === 1 ? randInt(rng, 12, 99) : difficulty === 2 ? randInt(rng, 102, 999) : randInt(rng, 12, 99);
  const b = difficulty === 3 ? randInt(rng, 12, 99) : randInt(rng, 3, 9);
  const answer = String(a * b);
  const explanation =
    difficulty === 3
      ? `Break ${b} into tens and ones: ${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}, and ${a} × ${b % 10} = ${a * (b % 10)}. Add them: ${answer}.`
      : `Break ${a} apart by place value and multiply each part by ${b}, then add: ${a} × ${b} = ${answer}.`;
  return {
    prompt: `${a} × ${b} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation,
  };
};

export const g4_long_division: Generator = (difficulty, rng) => {
  const divisor = randInt(rng, 2, 9);
  const quotient = difficulty === 1 ? randInt(rng, 11, 49) : difficulty === 2 ? randInt(rng, 12, 160) : randInt(rng, 120, 1300);
  const remainder = difficulty === 1 ? 0 : randInt(rng, 0, divisor - 1);
  const dividend = divisor * quotient + remainder;
  const answer = formatRemainder(quotient, remainder);
  const acceptable = remainder === 0 ? [answer, `${quotient} R 0`] : [answer];
  return {
    prompt: `${dividend} ÷ ${divisor} = ?${difficulty > 1 ? "\n(Write a remainder like this: 23 R 4)" : ""}`,
    type: "numeric",
    acceptableAnswers: acceptable,
    displayAnswer: answer,
    strict: true,
    explanation: `Divide one place at a time from the left: how many ${divisor}s fit, multiply, subtract, bring down the next digit. ${divisor} × ${quotient} = ${divisor * quotient}${remainder > 0 ? `, and ${dividend} - ${divisor * quotient} = ${remainder} left over` : ""}. Answer: ${answer}.`,
  };
};

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function factorsOf(n: number): number[] {
  const f: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i);
  return f;
}

export const g4_factors_multiples: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const n = randInt(rng, 2, 50);
    const answer = isPrime(n) ? "Prime" : "Composite";
    return {
      prompt: `Is ${n} prime or composite?`,
      type: "mc",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      choices: ["Prime", "Composite"],
      explanation: isPrime(n)
        ? `${n} can only be divided evenly by 1 and itself, so it's prime.`
        : `${n} has other factors besides 1 and itself (for example ${factorsOf(n).filter((f) => f !== 1 && f !== n).slice(0, 2).join(" and ")}), so it's composite.`,
    };
  }
  if (difficulty === 2) {
    const n = pick(rng, [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48]);
    const fs = factorsOf(n).filter((f) => f !== 1 && f !== n);
    const answer = String(pick(rng, fs));
    const nonFactors: string[] = [];
    let c = 2;
    while (nonFactors.length < 5 && c < n) {
      if (n % c !== 0) nonFactors.push(String(c));
      c++;
    }
    return {
      prompt: `Which number is a factor of ${n}?`,
      type: "mc",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      choices: makeChoices(rng, answer, nonFactors),
      explanation: `A factor divides evenly with nothing left over. ${n} ÷ ${answer} = ${n / Number(answer)}, so ${answer} is a factor. The factors of ${n} are ${factorsOf(n).join(", ")}.`,
    };
  }
  const n = randInt(rng, 3, 12);
  const k = randInt(rng, 3, 9);
  const answer = String(n * k);
  return {
    prompt: `What is the ${k}${k === 3 ? "rd" : "th"} multiple of ${n}? (Counting ${n} as the 1st.)`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Multiples are what you get when you skip count: ${Array.from({ length: k }, (_, i) => n * (i + 1)).join(", ")}. The ${k}th one is ${answer}.`,
  };
};

export const g4_equivalent_fractions: Generator = (difficulty, rng) => {
  const den = pick(rng, [2, 3, 4, 5, 6, 8]);
  const num = randInt(rng, 1, den - 1);
  const k = randInt(rng, 2, difficulty === 1 ? 4 : 6);
  if (difficulty === 1) {
    const answer = String(num * k);
    return {
      prompt: `Fill in the missing number:\n${num}/${den} = ?/${den * k}`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `The denominator was multiplied by ${k} (${den} × ${k} = ${den * k}), so multiply the numerator by ${k} too: ${num} × ${k} = ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const answer = String(den * k);
    return {
      prompt: `Fill in the missing number:\n${num}/${den} = ${num * k}/?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `The numerator was multiplied by ${k} (${num} × ${k} = ${num * k}), so multiply the denominator by ${k} too: ${den} × ${k} = ${answer}.`,
    };
  }
  const [sn, sd] = [num / gcd(num, den), den / gcd(num, den)];
  const answer = `${sn * k}/${sd * k}`;
  const distractors = [`${sn + 1}/${sd * k}`, `${sn * k}/${sd * k + 1}`, `${sn * k + 1}/${sd * k}`, `${sd}/${sn + sd}`];
  return {
    prompt: `Which fraction is equivalent to ${sn}/${sd}?`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: makeChoices(rng, answer, distractors),
    explanation: `Multiply the top and bottom by the same number (${k}): ${sn} × ${k} = ${sn * k} and ${sd} × ${k} = ${sd * k}, giving ${answer}.`,
  };
};

export const g4_compare_fractions: Generator = (difficulty, rng) => {
  const dens = difficulty === 1 ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 7, 8, 9, 10, 12];
  if (difficulty === 3) {
    const picks: [number, number][] = [];
    while (picks.length < 3) {
      const d = pick(rng, dens);
      const n = randInt(rng, 1, d - 1);
      if (!picks.some(([pn, pd]) => Math.abs(pn / pd - n / d) < 1e-9)) picks.push([n, d]);
    }
    const best = picks.reduce((a, b) => (a[0] / a[1] > b[0] / b[1] ? a : b));
    const answer = `${best[0]}/${best[1]}`;
    const choices = picks.map(([n, d]) => `${n}/${d}`);
    return {
      prompt: `Which fraction is the greatest?`,
      type: "mc",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      choices,
      explanation: `Compare each to 1/2, or rewrite them with a common denominator. As decimals: ${picks.map(([n, d]) => `${n}/${d} ≈ ${(n / d).toFixed(2)}`).join(", ")}. The greatest is ${answer}.`,
    };
  }
  const d1 = pick(rng, dens);
  let d2 = pick(rng, dens);
  while (d2 === d1) d2 = pick(rng, dens);
  const n1 = randInt(rng, 1, d1 - 1);
  let n2 = randInt(rng, 1, d2 - 1);
  while (Math.abs(n1 / d1 - n2 / d2) < 1e-9) n2 = randInt(rng, 1, d2 - 1);
  const answer = n1 / d1 > n2 / d2 ? ">" : "<";
  return {
    prompt: `Which symbol makes this true?\n${n1}/${d1} ___ ${n2}/${d2}`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: ["<", ">", "="],
    explanation: `Use a common denominator of ${d1 * d2}: ${n1}/${d1} = ${n1 * d2}/${d1 * d2} and ${n2}/${d2} = ${n2 * d1}/${d1 * d2}. Compare the numerators: ${n1 * d2} vs ${n2 * d1}. So ${n1}/${d1} ${answer} ${n2}/${d2}.`,
  };
};

export const g4_fraction_add_sub_like: Generator = (difficulty, rng) => {
  const den = pick(rng, difficulty === 1 ? [3, 4, 5, 6, 8] : [4, 5, 6, 8, 10, 12]);
  if (difficulty === 3) {
    const n1 = randInt(rng, 2, den - 1);
    const n2 = randInt(rng, den - n1 + 1, den - 1);
    const answer = formatMixed(n1 + n2, den);
    return {
      prompt: `${n1}/${den} + ${n2}/${den} = ?\n(Give your answer as a mixed number, like 1 1/4, in simplest form.)`,
      type: "numeric",
      acceptableAnswers: [answer, formatFraction(n1 + n2, den)],
      displayAnswer: answer,
      explanation: `Same denominator, so add the numerators: ${n1} + ${n2} = ${n1 + n2}, giving ${n1 + n2}/${den}. That's more than 1 whole: ${answer}.`,
    };
  }
  const isAdd = difficulty === 1;
  if (isAdd) {
    const n1 = randInt(rng, 1, den - 2);
    const n2 = randInt(rng, 1, den - 1 - n1);
    const answer = formatFraction(n1 + n2, den);
    return {
      prompt: `${n1}/${den} + ${n2}/${den} = ?\n(Simplest form.)`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Same denominator: keep it and add the tops. ${n1} + ${n2} = ${n1 + n2}, so ${n1 + n2}/${den}${answer !== `${n1 + n2}/${den}` ? ` = ${answer} in simplest form` : ""}.`,
    };
  }
  const n1 = randInt(rng, 2, den - 1);
  const n2 = randInt(rng, 1, n1 - 1);
  const answer = formatFraction(n1 - n2, den);
  return {
    prompt: `${n1}/${den} - ${n2}/${den} = ?\n(Simplest form.)`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Same denominator: keep it and subtract the tops. ${n1} - ${n2} = ${n1 - n2}, so ${n1 - n2}/${den}${answer !== `${n1 - n2}/${den}` ? ` = ${answer} in simplest form` : ""}.`,
  };
};

export const g4_fraction_times_whole: Generator = (difficulty, rng) => {
  const den = pick(rng, [2, 3, 4, 5, 6, 8]);
  const num = randInt(rng, 1, den - 1);
  const whole = randInt(rng, 2, difficulty === 1 ? 5 : 9);
  const product = num * whole;
  const answer = formatMixed(product, den);
  const acceptable = [answer, formatFraction(product, den), `${product}/${den}`];
  if (difficulty === 3) {
    const name = pick(rng, NAMES);
    return {
      prompt: `${name} runs ${num}/${den} of a mile every day for ${whole} days. How many miles is that in all?\n(Mixed number in simplest form.)`,
      type: "numeric",
      acceptableAnswers: acceptable,
      displayAnswer: answer,
      explanation: `${whole} × ${num}/${den} = ${product}/${den} = ${answer} miles. Multiply the whole number by the numerator; the denominator stays.`,
    };
  }
  return {
    prompt: `${whole} × ${num}/${den} = ?\n(Mixed number in simplest form.)`,
    type: "numeric",
    acceptableAnswers: acceptable,
    displayAnswer: answer,
    explanation: `${whole} × ${num}/${den} means ${whole} groups of ${num}/${den}: ${whole} × ${num} = ${product}, so ${product}/${den} = ${answer}.`,
  };
};

export const g4_decimals_intro: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const tenths = randInt(rng, 1, 9);
    const answer = `0.${tenths}`;
    return {
      prompt: `Write ${tenths}/10 as a decimal.`,
      type: "numeric",
      acceptableAnswers: [answer, `.${tenths}`],
      displayAnswer: answer,
      strict: true,
      explanation: `Tenths go in the first place after the decimal point: ${tenths}/10 = ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const hundredths = randInt(rng, 1, 99);
    const str = hundredths < 10 ? `0.0${hundredths}` : `0.${hundredths}`;
    const answer = `${hundredths}/100`;
    return {
      prompt: `Write ${str} as a fraction with a denominator of 100.`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      strict: true,
      explanation: `Two decimal places means hundredths: ${str} = ${answer}.`,
    };
  }
  const a = randInt(rng, 1, 99) / 100;
  let b = randInt(rng, 1, 9) / 10;
  if (Math.abs(a - b) < 1e-9) b = (randInt(rng, 1, 9) + 0.5) / 10;
  const answer = a > b ? ">" : "<";
  return {
    prompt: `Which symbol makes this true?\n${a} ___ ${b}`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: ["<", ">", "="],
    explanation: `Line up the decimal points and compare place by place. ${b} is the same as ${b.toFixed(2)}, so compare ${a.toFixed(2)} with ${b.toFixed(2)}: ${a} ${answer} ${b}.`,
  };
};

export const g4_multi_step_word: Generator = (difficulty, rng) => {
  const name = pick(rng, NAMES);
  if (difficulty === 1) {
    const packs = randInt(rng, 2, 6);
    const per = randInt(rng, 6, 12);
    const gave = randInt(rng, 3, packs * per - 4);
    const answer = String(packs * per - gave);
    return {
      prompt: `${name} bought ${packs} packs of ${per} pencils and gave away ${gave}. How many pencils are left?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `First find the total: ${packs} × ${per} = ${packs * per}. Then subtract what was given away: ${packs * per} - ${gave} = ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const price = randInt(rng, 3, 9);
    const count = randInt(rng, 3, 8);
    const paid = Math.ceil((price * count) / 10) * 10 + 10;
    const answer = String(paid - price * count);
    return {
      prompt: `${name} buys ${count} books that cost $${price} each and pays with $${paid}. How much change does ${name} get?`,
      type: "numeric",
      acceptableAnswers: [answer, `$${answer}`],
      displayAnswer: `$${answer}`,
      explanation: `Cost: ${count} × $${price} = $${price * count}. Change: $${paid} - $${price * count} = $${answer}.`,
    };
  }
  const teams = randInt(rng, 3, 6);
  const perTeam = randInt(rng, 4, 8);
  const groups = randInt(rng, 2, 5);
  let extra = randInt(rng, 2, 9);
  // nudge the coach count so everyone splits evenly across the buses
  extra += (groups - ((teams * perTeam + extra) % groups)) % groups;
  const total = teams * perTeam + extra;
  const answer = String(total / groups);
  return {
    prompt: `There are ${teams} teams with ${perTeam} players each, plus ${extra} coaches. Everyone is split equally into ${groups} buses. How many people ride on each bus?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Players: ${teams} × ${perTeam} = ${teams * perTeam}. Add coaches: ${teams * perTeam} + ${extra} = ${total}. Split into ${groups} buses: ${total} ÷ ${groups} = ${answer}.`,
  };
};
