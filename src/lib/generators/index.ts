import type { Generator } from "./types";
import * as grade3 from "./grade3";
import * as grade4 from "./grade4";
import * as grade5 from "./grade5";
import * as ratios from "./ratiosProportional";
import * as numberSystem from "./numberSystem";
import * as expressions from "./expressionsEquations";
import * as geometry from "./geometry";
import * as statistics from "./statistics";

export const GENERATORS: Record<string, Generator> = {
  ...grade3,
  ...grade4,
  ...grade5,
  ...ratios,
  ...numberSystem,
  ...expressions,
  ...geometry,
  ...statistics,
};

export type { GeneratedQuestion } from "./types";
