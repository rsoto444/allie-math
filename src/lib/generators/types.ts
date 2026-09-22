export interface GeneratedQuestion {
  prompt: string;
  type: "numeric" | "mc";
  /** Canonical answer plus any alternate accepted forms (e.g. "1/2" and "0.5"). */
  acceptableAnswers: string[];
  /** Display form of the correct answer, shown after answering. */
  displayAnswer: string;
  choices?: string[];
  explanation: string;
}

export type Generator = (difficulty: 1 | 2 | 3, rng: () => number) => GeneratedQuestion;
