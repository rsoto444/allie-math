"use client";

import { SessionRunner } from "@/components/SessionRunner";
import { startDiagnosticAction } from "@/lib/actions";
import type { Grade } from "@/lib/curriculum";

export function CheckupRunner({ grade }: { grade: Grade }) {
  return <SessionRunner start={null} onStart={() => startDiagnosticAction(grade)} />;
}
