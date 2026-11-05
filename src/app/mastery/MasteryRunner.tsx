"use client";

import { SessionRunner } from "@/components/SessionRunner";
import { startMasteryCheckAction } from "@/lib/actions";

export function MasteryRunner() {
  return <SessionRunner start={null} onStart={startMasteryCheckAction} />;
}
