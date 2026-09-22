import { randInt, pick } from "@/lib/rng";
import type { Generator } from "./types";

export const g_area_polygons: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? [3, 12] : difficulty === 2 ? [4, 20] : [5, 30];
  const base = randInt(rng, range[0], range[1]);
  const height = randInt(rng, range[0], range[1]);
  const shape = pick(rng, ["triangle", "parallelogram"] as const);

  if (shape === "triangle") {
    const doubled = base * height;
    const isWhole = doubled % 2 === 0;
    const answer = isWhole ? String(doubled / 2) : (doubled / 2).toString();
    return {
      prompt: `A triangle has a base of ${base} cm and a height of ${height} cm. What is its area in square centimeters?`,
      type: "numeric",
      acceptableAnswers: [answer],
      displayAnswer: answer,
      explanation: `Area of a triangle = (base × height) ÷ 2 = (${base} × ${height}) ÷ 2 = ${answer} cm².`,
    };
  }

  const answer = String(base * height);
  return {
    prompt: `A parallelogram has a base of ${base} cm and a height of ${height} cm. What is its area in square centimeters?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Area of a parallelogram = base × height = ${base} × ${height} = ${answer} cm².`,
  };
};

export const g_area_composite: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? [3, 8] : difficulty === 2 ? [4, 12] : [5, 16];
  const bigW = randInt(rng, range[0] + 3, range[1] + 4);
  const bigH = randInt(rng, range[0], range[1]);
  const cutW = randInt(rng, 2, Math.max(2, bigW - 2));
  const cutH = randInt(rng, 2, Math.max(2, bigH - 1));
  const bigArea = bigW * bigH;
  const cutArea = cutW * cutH;
  const answer = String(bigArea - cutArea);
  return {
    prompt: `A rectangle is ${bigW} m by ${bigH} m. A smaller rectangular section ${cutW} m by ${cutH} m is removed from one corner. What is the area of the remaining figure in square meters?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Find the area of the whole rectangle (${bigW}×${bigH}=${bigArea}) then subtract the removed piece (${cutW}×${cutH}=${cutArea}): ${bigArea} - ${cutArea} = ${answer} m².`,
  };
};

export const g_volume_rect_prism: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? [2, 8] : difficulty === 2 ? [2, 12] : [2, 15];
  const l = randInt(rng, range[0], range[1]);
  const w = randInt(rng, range[0], range[1]);
  const h = randInt(rng, range[0], range[1]);
  const answer = String(l * w * h);
  return {
    prompt: `A box is ${l} in long, ${w} in wide, and ${h} in tall. What is its volume in cubic inches?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: `Volume of a rectangular prism = length × width × height = ${l} × ${w} × ${h} = ${answer} in³.`,
  };
};

export const g_coordinate_plane: Generator = (difficulty, rng) => {
  const range = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 20;
  const sameX = rng() < 0.5;
  const x1 = randInt(rng, -range, range);
  const y1 = randInt(rng, -range, range);
  let x2 = x1;
  let y2 = y1;
  if (sameX) {
    while (y2 === y1) y2 = randInt(rng, -range, range);
  } else {
    while (x2 === x1) x2 = randInt(rng, -range, range);
  }
  const distance = sameX ? Math.abs(y2 - y1) : Math.abs(x2 - x1);
  const answer = String(distance);
  return {
    prompt: `Point A is at (${x1}, ${y1}) and point B is at (${x2}, ${y2}). What is the distance between them?`,
    type: "numeric",
    acceptableAnswers: [answer],
    displayAnswer: answer,
    explanation: sameX
      ? `The x-coordinates match, so the points are on a vertical line. Distance = |${y2} - ${y1}| = ${answer}.`
      : `The y-coordinates match, so the points are on a horizontal line. Distance = |${x2} - ${x1}| = ${answer}.`,
  };
};
