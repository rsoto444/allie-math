// Deterministic PRNG so a question can be regenerated server-side from its seed
// to check the answer, without ever sending the answer to the browser.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[randInt(rng, 0, arr.length - 1)];
}

export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function simplifyFraction(num: number, den: number): [number, number] {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const d = gcd(num, den);
  return [num / d, den / d];
}

export function formatFraction(num: number, den: number): string {
  const [n, d] = simplifyFraction(num, den);
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}

/** Builds a shuffled multiple-choice list containing the correct answer plus distractors. */
export function makeChoices(
  rng: () => number,
  correct: string,
  distractors: string[]
): string[] {
  const unique = Array.from(new Set(distractors.filter((d) => d !== correct)));
  const picked = shuffle(rng, unique).slice(0, 3);
  while (picked.length < 3) {
    // Fallback so we always have 4 options even if distractors collided.
    picked.push(`${correct}?`.slice(0, -1) + " ");
  }
  return shuffle(rng, [correct, ...picked]);
}

function parseNumericToken(raw: string): number | null {
  const s = raw.trim();
  if (s === "") return null;

  // Mixed number: "1 1/2"
  const mixed = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const n = Number(mixed[2]);
    const d = Number(mixed[3]);
    const sign = whole < 0 ? -1 : 1;
    return whole + sign * (n / d);
  }

  // Simple fraction: "3/4"
  const frac = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (frac) {
    const n = Number(frac[1]);
    const d = Number(frac[2]);
    if (d === 0) return null;
    return n / d;
  }

  // Percent: "25%"
  if (s.endsWith("%")) {
    const n = Number(s.slice(0, -1));
    return Number.isNaN(n) ? null : n;
  }

  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** Compares a learner's typed answer against one or more acceptable forms. */
export function answersMatch(userAnswer: string, acceptable: string[]): boolean {
  const user = userAnswer.trim().toLowerCase().replace(/\s+/g, " ");
  for (const candidate of acceptable) {
    const c = candidate.trim().toLowerCase().replace(/\s+/g, " ");
    if (user === c) return true;

    const userNum = parseNumericToken(user);
    const candNum = parseNumericToken(c);
    if (userNum !== null && candNum !== null && Math.abs(userNum - candNum) < 1e-6) {
      return true;
    }
  }
  return false;
}
