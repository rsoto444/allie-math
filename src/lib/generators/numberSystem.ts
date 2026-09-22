import { randInt, pick, gcd, lcm, formatFraction } from "@/lib/rng";
import type { Generator } from "./types";

export const ns_fraction_add_sub: Generator = (difficulty, rng) => {
  const denRange = difficulty === 1 ? [2, 6] : difficulty === 2 ? [2, 10] : [2, 12];
  const d1 = randInt(rng, denRange[0], denRange[1]);
  const d2 = difficulty === 1 ? d1 : randInt(rng, denRange[0], denRange[1]);
  const n1 = randInt(rng, 1, d1 - 1);
  const n2 = randInt(rng, 1, d2 - 1);
  const isAdd = rng() < 0.5;
  const commonDen = lcm(d1, d2);
  const scaledN1 = n1 * (commonDen / d1);
  const scaledN2 = n2 * (commonDen / d2);
  const resultNum = isAdd ? scaledN1 + scaledN2 : scaledN1 - scaledN2;
  if (resultNum < 0) {
    // keep results non-negative for this skill; swap the operands
    const answer = formatFraction(scaledN2 - scaledN1, commonDen);
    return {
      prompt: `${n2}/${d2} ${isAdd ? "+" : "-"} ${n1}/${d1} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Common denominator is ${commonDen}: ${scaledN2}/${commonDen} ${isAdd ? "+" : "-"} ${scaledN1}/${commonDen} = ${answer}.`,
    };
  }
  const answer = formatFraction(resultNum, commonDen);
  return {
    prompt: `${n1}/${d1} ${isAdd ? "+" : "-"} ${n2}/${d2} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Common denominator is ${commonDen}: ${scaledN1}/${commonDen} ${isAdd ? "+" : "-"} ${scaledN2}/${commonDen} = ${answer}.`,
  };
};

export const ns_fraction_mult_div: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? [2, 6] : difficulty === 2 ? [2, 9] : [2, 12];
  const n1 = randInt(rng, 1, range[1] - 1);
  const d1 = randInt(rng, range[0], range[1]);
  const n2 = randInt(rng, 1, range[1] - 1);
  const d2 = randInt(rng, range[0], range[1]);
  const isMult = difficulty === 1 ? true : rng() < 0.5;
  if (isMult) {
    const answer = formatFraction(n1 * n2, d1 * d2);
    return {
      prompt: `${n1}/${d1} × ${n2}/${d2} = ?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Multiply the numerators and the denominators: (${n1}×${n2})/(${d1}×${d2}) = ${n1 * n2}/${d1 * d2}, simplified to ${answer}.`,
    };
  }
  // Division: multiply by the reciprocal
  const answer = formatFraction(n1 * d2, d1 * n2);
  return {
    prompt: `${n1}/${d1} ÷ ${n2}/${d2} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Dividing by a fraction is the same as multiplying by its reciprocal: ${n1}/${d1} × ${d2}/${n2} = ${answer}.`,
  };
};

function roundTo(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export const ns_decimal_operations: Generator = (difficulty, rng) => {
  const places = difficulty === 1 ? 1 : 2;
  const scale = 10 ** places;
  const range = difficulty === 1 ? [1, 20] : difficulty === 2 ? [1, 50] : [1, 200];
  const a = roundTo(randInt(rng, range[0] * scale, range[1] * scale) / scale, places);
  const b = roundTo(randInt(rng, range[0] * scale, range[1] * scale) / scale, places);
  const ops = difficulty === 3 ? ["+", "-", "×"] : ["+", "-"];
  const op = pick(rng, ops);
  let result: number;
  if (op === "+") result = a + b;
  else if (op === "-") result = a - b;
  else result = a * b;
  const answer = roundTo(result, places + (op === "×" ? places : 0)).toString();
  return {
    prompt: `${a} ${op} ${b} = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Line up the decimal points and ${op === "×" ? "multiply" : op === "+" ? "add" : "subtract"}: ${a} ${op} ${b} = ${answer}.`,
  };
};

export const ns_integers_absolute_value: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 40;
  const mode = pick(rng, difficulty === 1 ? ["abs", "compare"] : ["abs", "compare", "add"]);

  if (mode === "abs") {
    const n = randInt(rng, -range, range) || -3;
    const answer = String(Math.abs(n));
    return {
      prompt: `What is |${n}|?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Absolute value is distance from zero, so it's always positive: |${n}| = ${answer}.`,
    };
  }

  if (mode === "compare") {
    const a = randInt(rng, -range, range);
    let b = randInt(rng, -range, range);
    while (b === a) b = randInt(rng, -range, range);
    const answer = a > b ? ">" : "<";
    const choices = [">", "<", "="];
    return {
      prompt: `Which symbol makes this true?\n${a} ___ ${b}`,
      type: "mc",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      choices,
      explanation: `On a number line, further right means greater. ${a} ${answer} ${b}.`,
    };
  }

  const a = randInt(rng, -range, range);
  const b = randInt(rng, -range, range);
  const answer = String(a + b);
  return {
    prompt: `${a} + (${b}) = ?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Adding a negative is the same as subtracting: ${a} + (${b}) = ${answer}.`,
  };
};

export const ns_gcf_lcm: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? [2, 12] : difficulty === 2 ? [4, 24] : [6, 48];
  const a = randInt(rng, range[0], range[1]);
  const b = randInt(rng, range[0], range[1]);
  const wantGcf = rng() < 0.5;
  const answer = String(wantGcf ? gcd(a, b) : lcm(a, b));
  return {
    prompt: `What is the ${wantGcf ? "greatest common factor (GCF)" : "least common multiple (LCM)"} of ${a} and ${b}?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: wantGcf
      ? `List the factors of both numbers and find the largest one they share: GCF(${a}, ${b}) = ${answer}.`
      : `List multiples of both numbers and find the smallest one they share: LCM(${a}, ${b}) = ${answer}.`,
  };
};
