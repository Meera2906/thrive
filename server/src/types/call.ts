// Types for the nurse-facing "patients to call" workflow.

export type CallOutcome =
  | "Contacted - will attend"
  | "Contacted - rescheduled"
  | "No answer"
  | "Left voicemail"
  | "Declined / refused";

/** A ready-to-read dialogue for the nurse, generated deterministically from
 * the SAME risk reasons and suggested actions the dashboard already shows —
 * no separate free-text generation step, so the script always matches the
 * reasons a nurse could also see on screen. */
export interface CallScript {
  opening: string;
  reasonLines: string[]; // one line per top risk driver, in plain speech
  talkingPoints: string[]; // action-oriented, tied to suggestedActions
  closing: string;
}

export interface CallLogEntry {
  id: string;
  patientId: string;
  calledAt: string; // ISO timestamp
  outcome: CallOutcome;
  notes: string | null;
}

export interface CallQueueItem {
  patientId: string;
  patientName: string;
  score: number | null;
  tier: string;
  topReasonLabel: string | null;
  script: CallScript;
  lastCall: CallLogEntry | null;
}
