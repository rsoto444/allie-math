import { randInt, pick, makeChoices } from "@/lib/rng";
import type { Generator } from "./types";

const NAMES = ["Mia", "Jake", "Sofia", "Liam", "Ava", "Noah", "Ellie", "Max"];
const ITEMS = ["stickers", "marbles", "crayons", "cookies", "pencils", "cards", "beads", "apples"];

const ones = (n: number) => n % 10;
const tens = (n: number) => Math.floor(n / 10) % 10;

export const g3_add_sub_regroup: Generator = (difficulty, rng) => {
  const min = difficulty === 1 ? 10 : 100;
  const max = difficulty === 1 ? 99 : 999;
  const isAdd = rng() < 0.5;

  if (isAdd) {
    // Keep drawing until the ones column regroups (and the tens too at the top level).
    let a = randInt(rng, min, max);
    let b = randInt(rng, min, max);
    for (let i = 0; i < 100; i++) {
      const onesRegroup = ones(a) + ones(b) >= 10;
      const tensRegroup = tens(a) + tens(b) + 1 >= 10;
      if (onesRegroup && (difficulty < 3 || tensRegroup)) break;
      a = randInt(rng, min, max);
      b = randInt(rng, min, max);
    }
    const answer = String(a + b);
    return {
      prompt: `${a} + ${b} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Add the ones first: ${ones(a)} + ${ones(b)} = ${ones(a) + ones(b)}. Write the ones digit and carry the 1 to the tens column. Then add the tens, then the hundreds. ${a} + ${b} = ${answer}.`,
    };
  }

  let a: number;
  let b: number;
  if (difficulty === 3) {
    // Subtracting across zeros, e.g. 500 - 237.
    a = randInt(rng, 3, 9) * 100;
    b = randInt(rng, 101, a - 1);
    if (ones(b) === 0) b += 3;
  } else {
    a = randInt(rng, min + 10, max);
    b = randInt(rng, min, a - 1);
    for (let i = 0; i < 100 && ones(a) >= ones(b); i++) {
      a = randInt(rng, min + 10, max);
      b = randInt(rng, min, a - 1);
    }
  }
  const answer = String(a - b);
  return {
    prompt: `${a} - ${b} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `You can't take ${ones(b)} from ${ones(a)} in the ones place, so borrow 1 ten (that makes ${ones(a) + 10}). Then subtract each column. ${a} - ${b} = ${answer}.`,
  };
};

export const g3_place_value_round: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const n = randInt(rng, 11, 299);
    const answer = String(Math.round(n / 10) * 10);
    return {
      prompt: `Round ${n} to the nearest ten.`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Look at the ones digit (${n % 10}). If it's 5 or more, round up; if it's 4 or less, round down. ${n} rounds to ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const n = randInt(rng, 101, 999);
    const answer = String(Math.round(n / 100) * 100);
    return {
      prompt: `Round ${n} to the nearest hundred.`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Look at the tens digit (${Math.floor((n % 100) / 10)}). 5 or more rounds up, 4 or less rounds down. ${n} rounds to ${answer}.`,
    };
  }
  const n = randInt(rng, 1000, 9999);
  const places = ["ones", "tens", "hundreds", "thousands"] as const;
  const idx = randInt(rng, 0, 3);
  const digit = Math.floor(n / 10 ** idx) % 10;
  const answer = String(digit);
  return {
    prompt: `What digit is in the ${places[idx]} place of ${n}?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `From right to left the places are ones, tens, hundreds, thousands. In ${n}, the ${places[idx]} digit is ${answer}.`,
  };
};

export const g3_mult_facts: Generator = (difficulty, rng) => {
  if (difficulty === 3 && rng() < 0.5) {
    const a = randInt(rng, 3, 9);
    const b = randInt(rng, 3, 9);
    const answer = String(b);
    return {
      prompt: `${a} × ? = ${a * b}`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Think: ${a} times what number makes ${a * b}? Count by ${a}s: ${Array.from({ length: b }, (_, i) => a * (i + 1)).join(", ")}. That's ${b} jumps, so the missing number is ${b}.`,
    };
  }
  const a = difficulty === 1 ? randInt(rng, 0, 5) : difficulty === 2 ? randInt(rng, 2, 9) : randInt(rng, 6, 9);
  const b = difficulty === 1 ? randInt(rng, 0, 10) : difficulty === 2 ? randInt(rng, 2, 9) : randInt(rng, 6, 9);
  const answer = String(a * b);
  return {
    prompt: `${a} × ${b} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `${a} × ${b} means ${a} groups of ${b}. Skip count by ${b}: ${Array.from({ length: Math.max(a, 1) }, (_, i) => b * (i + 1)).join(", ")}. So ${a} × ${b} = ${answer}.`,
  };
};

export const g3_div_facts: Generator = (difficulty, rng) => {
  const divisor = difficulty === 1 ? randInt(rng, 2, 5) : randInt(rng, 3, 9);
  const quotient = difficulty === 1 ? randInt(rng, 1, 9) : randInt(rng, 2, 9);
  const dividend = divisor * quotient;

  if (difficulty === 3 && rng() < 0.5) {
    const answer = String(divisor);
    return {
      prompt: `${dividend} ÷ ? = ${quotient}`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Division and multiplication are opposites: ${quotient} × ? = ${dividend}. ${quotient} × ${divisor} = ${dividend}, so the missing number is ${divisor}.`,
    };
  }
  const answer = String(quotient);
  return {
    prompt: `${dividend} ÷ ${divisor} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Ask: ${divisor} times what equals ${dividend}? ${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${answer}.`,
  };
};

export const g3_mult_div_word: Generator = (difficulty, rng) => {
  const name = pick(rng, NAMES);
  const item = pick(rng, ITEMS);
  if (difficulty === 1) {
    const groups = randInt(rng, 2, 6);
    const per = randInt(rng, 2, 9);
    const answer = String(groups * per);
    return {
      prompt: `${name} has ${groups} bags with ${per} ${item} in each bag. How many ${item} does ${name} have in all?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `${groups} bags × ${per} ${item} each = ${answer} ${item}. "Groups of" means multiply.`,
    };
  }
  if (difficulty === 2) {
    const groups = randInt(rng, 2, 8);
    const per = randInt(rng, 2, 9);
    const total = groups * per;
    const answer = String(per);
    return {
      prompt: `${name} shares ${total} ${item} equally among ${groups} friends. How many ${item} does each friend get?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Sharing equally means divide: ${total} ÷ ${groups} = ${answer} ${item} each.`,
    };
  }
  const groups = randInt(rng, 3, 7);
  const per = randInt(rng, 4, 9);
  const given = randInt(rng, 2, groups * per - 5);
  const answer = String(groups * per - given);
  return {
    prompt: `${name} buys ${groups} packs of ${item} with ${per} in each pack, then gives ${given} ${item} to a friend. How many ${item} does ${name} have left?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Step 1: ${groups} × ${per} = ${groups * per} ${item} in all. Step 2: ${groups * per} - ${given} = ${answer} left.`,
  };
};

export const g3_fraction_identify: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const den = pick(rng, [2, 3, 4, 6, 8]);
    const num = randInt(rng, 1, den - 1);
    const answer = `${num}/${den}`;
    return {
      prompt: `A pizza is cut into ${den} equal slices. You eat ${num} slices. What fraction of the pizza did you eat?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      strict: true,
      explanation: `The bottom number (denominator) is the total equal parts: ${den}. The top number (numerator) is how many you took: ${num}. So ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const den = pick(rng, [3, 4, 5, 6, 8]);
    const num = randInt(rng, 1, den - 1);
    const answer = `${num}/${den}`;
    return {
      prompt: `A number line from 0 to 1 is split into ${den} equal parts. What fraction is at the ${ordinal(num)} tick mark after 0?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      strict: true,
      explanation: `Each tick mark is 1/${den}. The ${ordinal(num)} mark is ${num} of those parts: ${answer}.`,
    };
  }
  const den = pick(rng, [2, 3, 4, 5, 6, 8]);
  const answer = `${den}/${den}`;
  const choices = makeChoices(rng, answer, [`1/${den}`, `${den}/1`, `${den - 1}/${den}`, `${den}/${den + 1}`]);
  return {
    prompt: `Which fraction is equal to 1 whole?`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices,
    explanation: `When the numerator and denominator are the same, you have all the parts, which is 1 whole. ${answer} = 1.`,
  };
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const g3_fraction_compare: Generator = (difficulty, rng) => {
  let n1: number, d1: number, n2: number, d2: number;
  if (difficulty === 1) {
    d1 = d2 = pick(rng, [4, 5, 6, 8, 10]);
    n1 = randInt(rng, 1, d1 - 1);
    n2 = randInt(rng, 1, d1 - 1);
    while (n2 === n1) n2 = randInt(rng, 1, d1 - 1);
  } else if (difficulty === 2) {
    n1 = n2 = randInt(rng, 1, 3);
    d1 = pick(rng, [3, 4, 5, 6, 8, 10]);
    d2 = pick(rng, [3, 4, 5, 6, 8, 10]);
    while (d2 === d1) d2 = pick(rng, [3, 4, 5, 6, 8, 10]);
  } else {
    const pairs: [number, number, number, number][] = [
      [1, 2, 2, 4], [1, 2, 3, 6], [2, 3, 4, 6], [1, 4, 2, 8], [3, 4, 6, 8],
      [1, 3, 2, 6], [2, 4, 4, 8], [1, 2, 4, 8], [2, 3, 3, 4], [3, 8, 1, 2],
    ];
    [n1, d1, n2, d2] = pick(rng, pairs);
    if (rng() < 0.5) [n1, d1, n2, d2] = [n2, d2, n1, d1];
  }
  const left = n1 / d1;
  const right = n2 / d2;
  const answer = Math.abs(left - right) < 1e-9 ? "=" : left > right ? ">" : "<";
  let explanation: string;
  if (d1 === d2) {
    explanation = `Same denominator, so compare the numerators: ${n1} vs ${n2}. More pieces of the same size means bigger. ${n1}/${d1} ${answer} ${n2}/${d2}.`;
  } else if (n1 === n2) {
    explanation = `Same numerator, so look at the denominators. Bigger denominator means smaller pieces, so the fraction with the smaller denominator is bigger. ${n1}/${d1} ${answer} ${n2}/${d2}.`;
  } else {
    explanation = `Rewrite with a common denominator: ${n1}/${d1} = ${(n1 * d2)}/${d1 * d2} and ${n2}/${d2} = ${n2 * d1}/${d1 * d2}. So ${n1}/${d1} ${answer} ${n2}/${d2}.`;
  }
  return {
    prompt: `Which symbol makes this true?\n${n1}/${d1} ___ ${n2}/${d2}`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: ["<", ">", "="],
    explanation,
  };
};

export const g3_area_perimeter: Generator = (difficulty, rng) => {
  const l = randInt(rng, 2, difficulty === 1 ? 9 : 12);
  const w = randInt(rng, 2, difficulty === 1 ? 9 : 12);
  if (difficulty === 1) {
    const answer = String(2 * (l + w));
    return {
      prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Perimeter is the distance all the way around: ${l} + ${w} + ${l} + ${w} = ${answer} cm.`,
    };
  }
  if (difficulty === 2) {
    const answer = String(l * w);
    return {
      prompt: `A rectangle is ${l} cm long and ${w} cm wide. What is its area in square centimeters?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Area is length × width: ${l} × ${w} = ${answer} square cm. Picture ${w} rows of ${l} squares.`,
    };
  }
  const area = l * w;
  const answer = String(w);
  return {
    prompt: `A rectangle has an area of ${area} square cm. Its length is ${l} cm. What is its width?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Area = length × width, so width = area ÷ length = ${area} ÷ ${l} = ${answer} cm.`,
  };
};
