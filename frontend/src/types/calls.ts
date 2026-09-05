/**
 * Types for the real, backend-backed calling feature (Calls page).
 *
 * These are intentionally separate from the mock `Call` type in
 * `@/store`, which powers the local demo console/knowledge/reports
 * pages and never talks to the backend.
 */

export type LiveCallStatus = "queued" | "in-progress" | "completed" | "failed";

export interface LiveCall {
  id: number;
  contact: string;
  phone: string;
  objective: string;
  status: LiveCallStatus;
  startedAt: string;
  duration?: string;
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
  backendCallId?: string;
  error?: string;
}
