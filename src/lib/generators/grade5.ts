import { randInt, pick, makeChoices, formatFraction, formatMixed, formatRemainder, lcm } from "@/lib/rng";
import type { Generator } from "./types";

const NAMES = ["Mia", "Jake", "Sofia", "Liam", "Ava", "Noah", "Ellie", "Max"];

function fmt(n: number, places = 2): string {
  return String(Math.round(n * 10 ** places) / 10 ** places);
}

export const g5_decimal_place_value: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const whole = randInt(rng, 1, 9);
    const d1 = randInt(rng, 0, 9);
    const d2 = randInt(rng, 0, 9);
    const d3 = randInt(rng, 1, 9);
    const num = `${whole}.${d1}${d2}${d3}`;
    const places = [
      ["tenths", d1],
      ["hundredths", d2],
      ["thousandths", d3],
    ] as const;
    const [placeName, digit] = pick(rng, places);
    const answer = String(digit);
    return {
      prompt: `What digit is in the ${placeName} place of ${num}?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `After the decimal point the places are tenths, hundredths, thousandths. In ${num}, the ${placeName} digit is ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const n = randInt(rng, 100, 9999) / 1000;
    const toTenths = rng() < 0.5;
    const answer = toTenths ? n.toFixed(1) : n.toFixed(2);
    return {
      prompt: `Round ${n} to the nearest ${toTenths ? "tenth" : "hundredth"}.`,
      type: "numeric",
      acceptableAnswers: [answer, String(Number(answer))],
      displayAnswer: answer,
      explanation: `Look at the digit just to the right of the ${toTenths ? "tenths" : "hundredths"} place. 5 or more rounds up. ${n} rounds to ${answer}.`,
    };
  }
  const base = randInt(rng, 10, 99) / 100;
  const options = [base, base + 0.005, base - 0.02, base + 0.1].map((v) => Math.round(v * 1000) / 1000);
  const answerNum = Math.max(...options);
  const answer = String(answerNum);
  return {
    prompt: `Which number is the greatest?`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: makeChoices(rng, answer, options.filter((o) => o !== answerNum).map(String)),
    explanation: `Line up the decimal points and compare from the left: tenths first, then hundredths, then thousandths. The greatest is ${answer}.`,
  };
};

export const g5_order_of_operations: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const a = randInt(rng, 2, 12);
    const b = randInt(rng, 2, 9);
    const c = randInt(rng, 2, 9);
    const answer = String(a + b * c);
    return {
      prompt: `${a} + ${b} × ${c} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Multiply before you add: ${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const a = randInt(rng, 2, 9);
    const b = randInt(rng, 2, 9);
    const c = randInt(rng, 2, 6);
    const d = randInt(rng, 1, 10);
    const answer = String((a + b) * c - d);
    return {
      prompt: `(${a} + ${b}) × ${c} - ${d} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Parentheses first: ${a} + ${b} = ${a + b}. Then multiply: ${a + b} × ${c} = ${(a + b) * c}. Then subtract: ${(a + b) * c} - ${d} = ${answer}.`,
    };
  }
  const c = randInt(rng, 2, 6);
  const sum = c * randInt(rng, 2, 8);
  const a = randInt(rng, 1, sum - 1);
  const b = sum - a;
  const m = randInt(rng, 2, 9);
  const e = randInt(rng, 1, 9);
  const answer = String(m * (sum / c) + e);
  return {
    prompt: `${m} × (${a} + ${b}) ÷ ${c} + ${e} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Parentheses: ${a} + ${b} = ${sum}. Then multiply and divide left to right: ${m} × ${sum} = ${m * sum}, ÷ ${c} = ${(m * sum) / c}. Then add ${e}: ${answer}.`,
  };
};

export const g5_long_division_2digit: Generator = (difficulty, rng) => {
  const divisor = randInt(rng, 11, difficulty === 1 ? 25 : 49);
  const quotient = difficulty === 3 ? randInt(rng, 40, 250) : randInt(rng, 5, 40);
  const remainder = difficulty === 1 ? 0 : randInt(rng, 0, divisor - 1);
  const dividend = divisor * quotient + remainder;
  const answer = formatRemainder(quotient, remainder);
  return {
    prompt: `${dividend} ÷ ${divisor} = ?${difficulty > 1 ? "\n(Write a remainder like this: 23 R 4)" : ""}`,
    type: "numeric",
    acceptableAnswers: remainder === 0 ? [answer, `${quotient} R 0`] : [answer],
    displayAnswer: answer,
    strict: true,
    explanation: `Estimate how many ${divisor}s fit into the first digits, multiply, subtract, bring down. ${divisor} × ${quotient} = ${divisor * quotient}${remainder > 0 ? `, leaving ${remainder}` : ""}. Answer: ${answer}.`,
  };
};

export const g5_fraction_add_sub_unlike: Generator = (difficulty, rng) => {
  let d1: number, d2: number;
  if (difficulty === 1) {
    d1 = pick(rng, [2, 3, 4, 5]);
    d2 = d1 * randInt(rng, 2, 3);
  } else {
    d1 = pick(rng, [2, 3, 4, 5, 6, 8]);
    d2 = pick(rng, [3, 4, 5, 6, 8, 10]);
    while (d2 === d1) d2 = pick(rng, [3, 4, 5, 6, 8, 10]);
  }
  const common = lcm(d1, d2);
  if (difficulty === 3) {
    const w1 = randInt(rng, 1, 4);
    const w2 = randInt(rng, 1, 4);
    const n1 = randInt(rng, 1, d1 - 1);
    const n2 = randInt(rng, 1, d2 - 1);
    const totalNum = (w1 * d1 + n1) * (common / d1) + (w2 * d2 + n2) * (common / d2);
    const answer = formatMixed(totalNum, common);
    return {
      prompt: `${w1} ${n1}/${d1} + ${w2} ${n2}/${d2} = ?\n(Mixed number in simplest form.)`,
      type: "numeric",
      acceptableAnswers: [answer, formatFraction(totalNum, common)],
      displayAnswer: answer,
      explanation: `Add the whole numbers (${w1} + ${w2} = ${w1 + w2}), then the fractions with a common denominator of ${common}: ${n1 * (common / d1)}/${common} + ${n2 * (common / d2)}/${common} = ${(n1 * common) / d1 + (n2 * common) / d2}/${common}. Combine: ${answer}.`,
    };
  }
  const isAdd = rng() < 0.6;
  const n1 = randInt(rng, 1, d1 - 1);
  const n2 = randInt(rng, 1, d2 - 1);
  const a = n1 * (common / d1);
  const b = n2 * (common / d2);
  if (isAdd) {
    const answer = formatMixed(a + b, common);
    return {
      prompt: `${n1}/${d1} + ${n2}/${d2} = ?\n(Simplest form.)`,
      type: "numeric",
      acceptableAnswers: [answer, formatFraction(a + b, common)],
      displayAnswer: answer,
      explanation: `Find a common denominator: ${common}. ${n1}/${d1} = ${a}/${common} and ${n2}/${d2} = ${b}/${common}. Add: ${a + b}/${common} = ${answer}.`,
    };
  }
  const [big, small, bigN, bigD, smallN, smallD] = a >= b ? [a, b, n1, d1, n2, d2] : [b, a, n2, d2, n1, d1];
  const answer = formatFraction(big - small, common);
  return {
    prompt: `${bigN}/${bigD} - ${smallN}/${smallD} = ?\n(Simplest form.)`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Common denominator: ${common}. ${bigN}/${bigD} = ${big}/${common} and ${smallN}/${smallD} = ${small}/${common}. Subtract: ${big - small}/${common} = ${answer}.`,
  };
};

export const g5_mixed_numbers: Generator = (difficulty, rng) => {
  const den = pick(rng, [2, 3, 4, 5, 6, 8]);
  if (difficulty === 1) {
    const whole = randInt(rng, 1, 5);
    const num = randInt(rng, 1, den - 1);
    const improper = whole * den + num;
    const answer = `${whole} ${num}/${den}`;
    return {
      prompt: `Write ${improper}/${den} as a mixed number.`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      strict: true,
      explanation: `Divide: ${improper} ÷ ${den} = ${whole} with ${num} left over. The whole number is ${whole} and the leftover becomes the fraction: ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const whole = randInt(rng, 1, 6);
    const num = randInt(rng, 1, den - 1);
    const answer = `${whole * den + num}/${den}`;
    return {
      prompt: `Write ${whole} ${num}/${den} as an improper fraction.`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      strict: true,
      explanation: `Multiply the whole number by the denominator and add the numerator: ${whole} × ${den} + ${num} = ${whole * den + num}. Keep the denominator: ${answer}.`,
    };
  }
  const w1 = randInt(rng, 1, 4);
  const n1 = randInt(rng, 1, den - 1);
  const w2 = randInt(rng, 1, 4);
  let n2 = randInt(rng, 1, den - 1);
  if (w1 === w2 && n1 === n2) n2 = n2 === 1 ? 2 : n2 - 1;
  const v1 = w1 + n1 / den;
  const v2 = w2 + n2 / den;
  const answer = v1 > v2 ? ">" : "<";
  return {
    prompt: `Which symbol makes this true?\n${w1} ${n1}/${den} ___ ${w2} ${n2}/${den}`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: ["<", ">", "="],
    explanation: `Compare the whole numbers first (${w1} vs ${w2}). If they're equal, compare the fractions (${n1}/${den} vs ${n2}/${den}). So ${w1} ${n1}/${den} ${answer} ${w2} ${n2}/${den}.`,
  };
};

export const g5_fraction_multiply: Generator = (difficulty, rng) => {
  if (difficulty === 3) {
    const whole = randInt(rng, 1, 3);
    const d1 = pick(rng, [2, 3, 4]);
    const n1 = randInt(rng, 1, d1 - 1);
    const d2 = pick(rng, [2, 3, 4, 5]);
    const n2 = randInt(rng, 1, d2 - 1);
    const improperN = whole * d1 + n1;
    const answer = formatMixed(improperN * n2, d1 * d2);
    return {
      prompt: `${whole} ${n1}/${d1} × ${n2}/${d2} = ?\n(Simplest form.)`,
      type: "numeric",
      acceptableAnswers: [answer, formatFraction(improperN * n2, d1 * d2)],
      displayAnswer: answer,
      explanation: `First turn the mixed number into an improper fraction: ${whole} ${n1}/${d1} = ${improperN}/${d1}. Then multiply tops and bottoms: (${improperN} × ${n2})/(${d1} × ${d2}) = ${improperN * n2}/${d1 * d2} = ${answer}.`,
    };
  }
  const d1 = pick(rng, [2, 3, 4, 5, 6]);
  const d2 = pick(rng, [2, 3, 4, 5, 6, 8]);
  const n1 = difficulty === 1 ? 1 : randInt(rng, 1, d1 - 1);
  const n2 = randInt(rng, 1, d2 - 1);
  const answer = formatFraction(n1 * n2, d1 * d2);
  return {
    prompt: `${n1}/${d1} × ${n2}/${d2} = ?\n(Simplest form.)`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Multiply the numerators and multiply the denominators: (${n1} × ${n2})/(${d1} × ${d2}) = ${n1 * n2}/${d1 * d2}${answer !== `${n1 * n2}/${d1 * d2}` ? ` = ${answer} in simplest form` : ""}.`,
  };
};

export const g5_fraction_divide_unit: Generator = (difficulty, rng) => {
  const den = pick(rng, [2, 3, 4, 5, 6, 8]);
  const whole = randInt(rng, 2, difficulty === 1 ? 5 : 9);
  if (difficulty === 1) {
    const answer = `1/${den * whole}`;
    return {
      prompt: `1/${den} ÷ ${whole} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Splitting 1/${den} into ${whole} equal pieces makes pieces ${whole} times smaller: 1/${den} ÷ ${whole} = 1/${den * whole}.`,
    };
  }
  if (difficulty === 2) {
    const answer = String(whole * den);
    return {
      prompt: `${whole} ÷ 1/${den} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Ask: how many 1/${den}s fit into ${whole}? Each whole has ${den} of them, so ${whole} × ${den} = ${answer}.`,
    };
  }
  const name = pick(rng, NAMES);
  const answer = String(whole * den);
  return {
    prompt: `${name} has ${whole} pounds of trail mix and puts 1/${den} pound in each bag. How many bags can ${name} fill?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `This is ${whole} ÷ 1/${den}. Each pound fills ${den} bags, so ${whole} pounds fill ${whole} × ${den} = ${answer} bags.`,
  };
};

export const g5_decimal_add_sub: Generator = (difficulty, rng) => {
  const a = randInt(rng, 100, difficulty === 1 ? 999 : 9999) / 100;
  const b = randInt(rng, 100, difficulty === 1 ? 999 : 9999) / 100;
  if (difficulty === 3) {
    const name = pick(rng, NAMES);
    const [big, small] = a >= b ? [a, b] : [b, a];
    const answer = fmt(big - small);
    return {
      prompt: `${name} has $${big.toFixed(2)} and spends $${small.toFixed(2)}. How much money is left?`,
      type: "numeric",
      acceptableAnswers: [answer, `$${answer}`, (big - small).toFixed(2), `$${(big - small).toFixed(2)}`],
      displayAnswer: `$${(big - small).toFixed(2)}`,
      explanation: `Line up the decimal points and subtract: ${big.toFixed(2)} - ${small.toFixed(2)} = ${(big - small).toFixed(2)}.`,
    };
  }
  const isAdd = difficulty === 1 || rng() < 0.5;
  if (isAdd) {
    const answer = fmt(a + b);
    return {
      prompt: `${a} + ${b} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Line up the decimal points, then add like whole numbers. ${a} + ${b} = ${answer}.`,
    };
  }
  const [big, small] = a >= b ? [a, b] : [b, a];
  const answer = fmt(big - small);
  return {
    prompt: `${big} - ${small} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Line up the decimal points (add a 0 at the end if one number is shorter), then subtract. ${big} - ${small} = ${answer}.`,
  };
};

export const g5_decimal_mult_div: Generator = (difficulty, rng) => {
  if (difficulty === 1) {
    const a = randInt(rng, 11, 99) / 10;
    const b = randInt(rng, 2, 9);
    const answer = fmt(a * b);
    return {
      prompt: `${a} × ${b} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Multiply as if there were no decimal: ${a * 10} × ${b} = ${a * 10 * b}. Then put the decimal back: 1 decimal place, so ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const a = randInt(rng, 11, 99) / 10;
    const b = randInt(rng, 2, 9) / 10;
    const answer = fmt(a * b);
    return {
      prompt: `${a} × ${b} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Multiply ${a * 10} × ${b * 10} = ${a * 10 * (b * 10)}. The factors have 2 decimal places in total, so the answer has 2: ${answer}.`,
    };
  }
  const b = randInt(rng, 2, 9);
  const q = randInt(rng, 11, 99) / 10;
  const a = fmt(q * b);
  const answer = String(q);
  return {
    prompt: `${a} ÷ ${b} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Divide as usual and keep the decimal point in the same spot in the answer: ${a} ÷ ${b} = ${answer}. Check: ${answer} × ${b} = ${a}.`,
  };
};

export const g5_volume: Generator = (difficulty, rng) => {
  const l = randInt(rng, 2, difficulty === 1 ? 5 : 10);
  const w = randInt(rng, 2, difficulty === 1 ? 5 : 10);
  const h = randInt(rng, 2, difficulty === 1 ? 5 : 10);
  if (difficulty === 3) {
    const answer = String(h);
    return {
      prompt: `A box has a volume of ${l * w * h} cubic cm. It is ${l} cm long and ${w} cm wide. How tall is it?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Volume = length × width × height. ${l} × ${w} = ${l * w}, so height = ${l * w * h} ÷ ${l * w} = ${answer} cm.`,
    };
  }
  const answer = String(l * w * h);
  return {
    prompt:
      difficulty === 1
        ? `A box is built from unit cubes. It is ${l} cubes long, ${w} cubes wide, and ${h} cubes tall. How many cubes is that?`
        : `A rectangular prism is ${l} cm long, ${w} cm wide, and ${h} cm tall. What is its volume in cubic cm?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Volume = length × width × height = ${l} × ${w} × ${h} = ${answer}.`,
  };
};

export const g5_coordinate_plane: Generator = (difficulty, rng) => {
  const x = randInt(rng, 1, 9);
  const y = randInt(rng, 1, 9);
  if (difficulty === 1) {
    const answer = `(${x}, ${y})`;
    return {
      prompt: `Start at the origin (0, 0). Move ${x} units right and ${y} units up. What are the coordinates of the point?`,
      type: "numeric",
      acceptableAnswers: [answer, `${x}, ${y}`, `${x},${y}`],
      displayAnswer: answer,
      strict: true,
      explanation: `The first number is how far right (x), the second is how far up (y): ${answer}.`,
    };
  }
  if (difficulty === 2) {
    const askX = rng() < 0.5;
    const answer = String(askX ? x : y);
    return {
      prompt: `Point A is at (${x}, ${y}). What is its ${askX ? "x" : "y"}-coordinate?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `In (x, y), the first number is x and the second is y. The ${askX ? "x" : "y"}-coordinate is ${answer}.`,
    };
  }
  const dx = randInt(rng, 1, 5);
  const dy = randInt(rng, 1, 5);
  const answer = `(${x + dx}, ${y + dy})`;
  return {
    prompt: `Start at (${x}, ${y}). Move ${dx} units right and ${dy} units up. Where do you end up?`,
    type: "numeric",
    acceptableAnswers: [answer, `${x + dx}, ${y + dy}`, `${x + dx},${y + dy}`],
    displayAnswer: answer,
    strict: true,
    explanation: `Right adds to x: ${x} + ${dx} = ${x + dx}. Up adds to y: ${y} + ${dy} = ${y + dy}. So ${answer}.`,
  };
};
