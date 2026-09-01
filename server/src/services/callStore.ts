import { randomUUID } from "crypto";
import { db } from "./patientStore";
import { CallLogEntry, CallOutcome } from "../types/call";

export function logCall(patientId: string, outcome: CallOutcome, notes: string | null): CallLogEntry {
  const entry: CallLogEntry = {
    id: randomUUID(),
    patientId,
    calledAt: new Date().toISOString(),
    outcome,
    notes,
  };

  db.prepare(
    `INSERT INTO call_log (id, patientId, calledAt, outcome, notes)
     VALUES (:id, :patientId, :calledAt, :outcome, :notes)`
  ).run({ ...entry, notes: entry.notes ?? null });

  return entry;
}

/** Most recent call log entry per patient, keyed by patientId. */
export function getLastCallByPatient(): Map<string, CallLogEntry> {
  const rows = db
    .prepare(`SELECT * FROM call_log ORDER BY calledAt DESC`)
    .all() as unknown as CallLogEntry[];

  const map = new Map<string, CallLogEntry>();
  for (const row of rows) {
    if (!map.has(row.patientId)) map.set(row.patientId, row);
  }
  return map;
}

export function getCallHistory(patientId: string): CallLogEntry[] {
  return db
    .prepare(`SELECT * FROM call_log WHERE patientId = ? ORDER BY calledAt DESC`)
    .all(patientId) as unknown as CallLogEntry[];
}
