import { randInt, pick } from "@/lib/rng";
import type { Generator } from "./types";

const VARS = ["x", "y", "n", "a", "b"];

export const ee_evaluate_expressions: Generator = (difficulty, rng) => {
  const v = pick(rng, VARS);
  const value = randInt(rng, difficulty === 1 ? 1 : 2, difficulty === 1 ? 10 : 15);
  const coeff = randInt(rng, 2, difficulty === 3 ? 12 : 8);

  if (difficulty <= 2) {
    const constant = randInt(rng, 1, 20);
    const useExponent = difficulty === 2 && rng() < 0.4;
    if (useExponent) {
      const answer = String(value * value + constant);
      return {
        prompt: `Evaluate ${v}² + ${constant} when ${v} = ${value}.`,
        type: "numeric",
        acceptableAnswers: [answer],
        displayAnswer: answer,
        explanation: `${v}² means ${v}×${v}. ${value}² = ${value * value}, then ${value * value} + ${constant} = ${answer}.`,
      };
    }
    const answer = String(coeff * value + constant);
    return {
      prompt: `Evaluate ${coeff}${v} + ${constant} when ${v} = ${value}.`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Substitute ${value} for ${v}: ${coeff}×${value} + ${constant} = ${coeff * value} + ${constant} = ${answer}.`,
    };
  }

  const constant = randInt(rng, 1, 20);
  const secondCoeff = randInt(rng, 2, 6);
  const answer = String(coeff * value - secondCoeff * value + constant);
  return {
    prompt: `Evaluate ${coeff}${v} - ${secondCoeff}${v} + ${constant} when ${v} = ${value}.`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Combine like terms first: (${coeff}-${secondCoeff})${v} + ${constant} = ${coeff - secondCoeff}${v} + ${constant}. Then substitute ${v} = ${value}: ${answer}.`,
  };
};

export const ee_simplify_expressions: Generator = (difficulty, rng) => {
  const v = pick(rng, VARS);
  const c1 = randInt(rng, 2, difficulty === 1 ? 9 : 12);
  const c2 = randInt(rng, 2, difficulty === 1 ? 9 : 12);

  if (difficulty <= 2) {
    const total = c1 + c2;
    const answer = `${total}${v}`;
    return {
      prompt: `Combine like terms: ${c1}${v} + ${c2}${v} = ?`,
      type: "numeric",
      acceptableAnswers: [answer, `${total}`],
      displayAnswer: answer,
      explanation: `${c1}${v} and ${c2}${v} are like terms, so add the coefficients: ${c1}+${c2} = ${total}, giving ${answer}.`,
    };
  }

  // Distributive property: c1(v + c2) = c1v + c1*c2
  const product = c1 * c2;
  const answer = `${c1}${v} + ${product}`;
  return {
    prompt: `Use the distributive property to expand: ${c1}(${v} + ${c2})`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Multiply ${c1} by each term inside the parentheses: ${c1}×${v} + ${c1}×${c2} = ${c1}${v} + ${product}.`,
  };
};

export const ee_one_step_equations: Generator = (difficulty, rng) => {
  const v = pick(rng, VARS);
  const answer = randInt(rng, difficulty === 1 ? 1 : 2, difficulty === 3 ? 25 : 15);
  const opType = pick(rng, ["add", "sub", "mult", "div"] as const);

  if (opType === "add") {
    const k = randInt(rng, 1, 20);
    const answerStr = String(answer);
    return {
      prompt: `Solve for ${v}: ${v} + ${k} = ${answer + k}`,
      type: "numeric",
      acceptableAnswers: [answerStr],
      displayAnswer: answerStr,
      explanation: `Subtract ${k} from both sides: ${v} = ${answer + k} - ${k} = ${answer}.`,
    };
  }
  if (opType === "sub") {
    const k = randInt(rng, 1, 20);
    const answerStr = String(answer);
    return {
      prompt: `Solve for ${v}: ${v} - ${k} = ${answer - k}`,
      type: "numeric",
      acceptableAnswers: [answerStr],
      displayAnswer: answerStr,
      explanation: `Add ${k} to both sides: ${v} = ${answer - k} + ${k} = ${answer}.`,
    };
  }
  if (opType === "mult") {
    const k = randInt(rng, 2, difficulty === 1 ? 6 : 10);
    const answerStr = String(answer);
    return {
      prompt: `Solve for ${v}: ${k}${v} = ${answer * k}`,
      type: "numeric",
      acceptableAnswers: [answerStr],
      displayAnswer: answerStr,
      explanation: `Divide both sides by ${k}: ${v} = ${answer * k} ÷ ${k} = ${answer}.`,
    };
  }
  const k = randInt(rng, 2, difficulty === 1 ? 6 : 10);
  const answerStr = String(answer);
  return {
    prompt: `Solve for ${v}: ${v} ÷ ${k} = ${answer}`,
    type: "numeric",
    acceptableAnswers: [answerStr],
    displayAnswer: answerStr,
    explanation: `Multiply both sides by ${k}: ${v} = ${answer} × ${k} = ${answer * k}.`,
  };
};

export const ee_inequalities: Generator = (difficulty, rng) => {
  const v = pick(rng, VARS);
  const boundary = randInt(rng, difficulty === 1 ? 1 : 3, difficulty === 3 ? 30 : 20);
  const direction = pick(rng, [">", "<", "≥", "≤"] as const);
  const testValues = [boundary - 2, boundary - 1, boundary, boundary + 1, boundary + 2];
  const testValue = pick(rng, testValues);

  const satisfies = (() => {
    if (direction === ">") return testValue > boundary;
    if (direction === "<") return testValue < boundary;
    if (direction === "≥") return testValue >= boundary;
    return testValue <= boundary;
  })();

  const answer = satisfies ? "Yes" : "No";
  return {
    prompt: `Does ${v} = ${testValue} make this true?\n${v} ${direction} ${boundary}`,
    type: "mc",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    choices: ["Yes", "No"],
    explanation: `Substitute ${testValue} for ${v}: is ${testValue} ${direction} ${boundary}? That statement is ${satisfies ? "true" : "false"}, so the answer is ${answer}.`,
  };
};
