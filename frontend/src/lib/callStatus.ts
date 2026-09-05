import type { LiveCallStatus } from "@/types/calls";

const TERMINAL_SNAPSERVE_STATUSES = new Set([
  "completed",
  "failed",
  "no_pickup",
  "busy",
  "error",
  "cancelled",
]);

/** Maps a raw SnapServe call status string to our UI's status enum. */
export function mapSnapServeStatus(snapStatus: string): LiveCallStatus {
  const normalized = snapStatus.toLowerCase();
  if (normalized === "completed") return "completed";
  if (TERMINAL_SNAPSERVE_STATUSES.has(normalized)) return "failed";
  return "in-progress";
}
