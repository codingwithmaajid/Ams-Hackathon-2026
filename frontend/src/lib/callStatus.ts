import type { LiveCallStatus } from "@/types/calls";

/**
 * Bolna execution statuses: queued → initiated → ringing → in-progress
 * → call-disconnected → completed. `call-disconnected` is not final: Bolna
 * finalizes transcript and recording a few seconds later under `completed`.
 */
const BOLNA_FAILURE_STATUSES = new Set([
  "no-answer",
  "busy",
  "failed",
  "canceled",
  "stopped",
  "error",
  "balance-low",
]);

/** Maps a raw Bolna execution status string to our UI's status enum. */
export function mapBolnaStatus(bolnaStatus: string): LiveCallStatus {
  const normalized = bolnaStatus.toLowerCase();
  if (normalized === "completed") return "completed";
  if (BOLNA_FAILURE_STATUSES.has(normalized)) return "failed";
  if (normalized === "queued" || normalized === "scheduled") return "queued";
  return "in-progress";
}
