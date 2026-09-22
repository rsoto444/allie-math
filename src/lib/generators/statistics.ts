import { randInt, pick, shuffle } from "@/lib/rng";
import type { Generator } from "./types";

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mode(nums: number[]): string {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  const max = Math.max(...counts.values());
  if (max === 1) return "no mode";
  const modes = [...counts.entries()].filter(([, c]) => c === max).map(([v]) => v);
  return modes.sort((a, b) => a - b).join(", ");
}

function range(nums: number[]): number {
  return Math.max(...nums) - Math.min(...nums);
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export const sp_mean_median_mode_range: Generator = (difficulty, rng) => {
  const count = difficulty === 1 ? 5 : difficulty === 2 ? 6 : 7;
  const max = difficulty === 1 ? 20 : difficulty === 2 ? 40 : 60;
  const nums: number[] = [];
  for (let i = 0; i < count; i++) nums.push(randInt(rng, 1, max));
  // guarantee a real mode about half the time so "mode" questions aren't always "no mode"
  if (rng() < 0.5) nums[count - 1] = nums[0];

  const measure = pick(rng, ["mean", "median", "mode", "range"] as const);
  const dataStr = nums.join(", ");
  let answer: string;
  let explanation: string;
  if (measure === "mean") {
    answer = fmt(mean(nums));
    explanation = `Add all the values (${nums.reduce((a, b) => a + b, 0)}) and divide by how many there are (${count}): ${answer}.`;
  } else if (measure === "median") {
    answer = fmt(median(nums));
    explanation = `Sort the values and find the middle one (average the two middle values if there's an even count): ${answer}.`;
  } else if (measure === "mode") {
    answer = mode(nums);
    explanation = `The mode is the value that appears most often: ${answer}.`;
  } else {
    answer = fmt(range(nums));
    explanation = `Range = greatest value - least value = ${Math.max(...nums)} - ${Math.min(...nums)} = ${answer}.`;
  }

  return {
    prompt: `Find the ${measure} of this data set:\n${dataStr}`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation,
  };
};

export const sp_interpret_data: Generator = (difficulty, rng) => {
  const names = ["Mia", "Jake", "Sofia", "Liam", "Ava", "Noah"];
  const count = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6;
  const shuffled = shuffle(rng, names).slice(0, count);
  const max = difficulty === 1 ? 15 : difficulty === 2 ? 30 : 50;
  const values = shuffled.map(() => randInt(rng, 1, max));
  const pairs = shuffled.map((n, i) => `${n}: ${values[i]}`).join(", ");

  const askType = pick(rng, ["max", "min", "diff", "total"] as const);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const maxName = shuffled[values.indexOf(maxVal)];
  const minName = shuffled[values.indexOf(minVal)];

  if (askType === "max") {
    return {
      prompt: `This table shows how many books each student read:\n${pairs}\nWho read the most books?`,
      type: "mc",
      acceptableAnswers: [maxName],
      displayAnswer: maxName,
      choices: shuffled,
      explanation: `${maxName} has the highest value (${maxVal}).`,
    };
  }
  if (askType === "min") {
    return {
      prompt: `This table shows how many books each student read:\n${pairs}\nWho read the fewest books?`,
      type: "mc",
      acceptableAnswers: [minName],
      displayAnswer: minName,
      choices: shuffled,
      explanation: `${minName} has the lowest value (${minVal}).`,
    };
  }
  if (askType === "diff") {
    const answer = String(maxVal - minVal);
    return {
      prompt: `This table shows how many books each student read:\n${pairs}\nWhat is the difference between the most and the fewest books read?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `${maxName} read ${maxVal} and ${minName} read ${minVal}. ${maxVal} - ${minVal} = ${answer}.`,
    };
  }
  const total = values.reduce((a, b) => a + b, 0);
  const answer = String(total);
  return {
    prompt: `This table shows how many books each student read:\n${pairs}\nHow many books did they read in total?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Add all the values together: ${values.join(" + ")} = ${answer}.`,
  };
};

export const sp_probability_basic: Generator = (difficulty, rng) => {
  const colors = ["red", "blue", "green", "yellow", "purple"];
  const numColors = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  const chosen = shuffle(rng, colors).slice(0, numColors);
  const counts = chosen.map(() => randInt(rng, 2, difficulty === 1 ? 6 : 10));
  const total = counts.reduce((a, b) => a + b, 0);
  const targetIndex = randInt(rng, 0, numColors - 1);
  const targetColor = chosen[targetIndex];
  const targetCount = counts[targetIndex];
  const description = chosen.map((c, i) => `${counts[i]} ${c}`).join(", ");
  const answer = `${targetCount}/${total}`;
  return {
    prompt: `A bag has ${description} marbles. If you pick one marble without looking, what is the probability it is ${targetColor}? (Write as a fraction.)`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Probability = favorable outcomes ÷ total outcomes = ${targetCount} ${targetColor} ÷ ${total} total marbles = ${answer}.`,
  };
};
