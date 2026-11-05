"use client";

import { SessionRunner } from "@/components/SessionRunner";
import { startReviewAction } from "@/lib/actions";

export function ReviewRunner() {
  return <SessionRunner start={null} onStart={startReviewAction} />;
}
