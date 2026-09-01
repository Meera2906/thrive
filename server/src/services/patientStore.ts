/**
 * SQLite-backed patient data store (replaces in-memory seedData.ts).
 *
 * Uses the built-in `node:sqlite` module (Node ≥ 22.5, stable in Node 25).
 * No extra npm dependencies or native build tools required.
 *
 * DB file location: DB_PATH env var, or `patients.db` at the project root
 * (three directories up from dist/src/services/ at runtime).
 *
 * Seeding: seed patients are inserted ONLY when the table is empty —
 * idempotent, so data survives restarts but a fresh env still gets all 18
 * demo patients automatically.
 *
 * The Patient interface (server/src/types/patient.ts) is the contract —
 * this file is an implementation detail of the data layer only.
 */

import path from "path";
// node:sqlite is experimental in Node ≥ 22.5; fully available in Node 25.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

import { Patient } from "../types/patient";
import { seedPatients } from "./seedData";

// ---------------------------------------------------------------------------
// DB setup
// ---------------------------------------------------------------------------

const DB_PATH =
  process.env.DB_PATH ??
  path.resolve(__dirname, "..", "..", "..", "patients.db");

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.exec("PRAGMA journal_mode = WAL");

// Create table if it doesn't already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    age                     INTEGER NOT NULL,
    distanceKm              REAL NOT NULL,
    totalAppointmentCount   INTEGER NOT NULL,
    missedAppointmentCount  INTEGER NOT NULL,
    daysSinceLastVisit      INTEGER NOT NULL,
    expectedFrequencyDays   INTEGER NOT NULL,
    treatmentElapsedDays    INTEGER NOT NULL,
    treatmentTotalDays      INTEGER NOT NULL
  )
`);

// ---------------------------------------------------------------------------
// Migration — add `email` column for pre-existing DB files that predate
// the bulk-upload / bulk-email features. node:sqlite has no
// "ADD COLUMN IF NOT EXISTS", so check pragma table_info first.
// ---------------------------------------------------------------------------

const patientColumns = db.prepare("PRAGMA table_info(patients)").all() as Array<{
  name: string;
}>;
if (!patientColumns.some((c) => c.name === "email")) {
  db.exec("ALTER TABLE patients ADD COLUMN email TEXT");
}

// ---------------------------------------------------------------------------
// Supporting tables for uploads / call log / sent emails
// ---------------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS uploads (
    id                   TEXT PRIMARY KEY,
    filename             TEXT NOT NULL,
    uploadedAt           TEXT NOT NULL,
    sizeBytes            INTEGER NOT NULL,
    rawBlob              BLOB NOT NULL,
    analyticsJson        TEXT NOT NULL,
    errorsJson           TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS call_log (
    id          TEXT PRIMARY KEY,
    patientId   TEXT NOT NULL,
    calledAt    TEXT NOT NULL,
    outcome     TEXT NOT NULL,
    notes       TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sent_emails (
    id           TEXT PRIMARY KEY,
    batchId      TEXT NOT NULL,
    patientId    TEXT NOT NULL,
    patientName  TEXT NOT NULL,
    toAddress    TEXT,
    sentAt       TEXT NOT NULL,
    subject      TEXT NOT NULL,
    body         TEXT NOT NULL,
    status       TEXT NOT NULL
  )
`);

// ---------------------------------------------------------------------------
// Idempotent seed — only runs on a truly empty table
// ---------------------------------------------------------------------------

const countRow = db.prepare("SELECT COUNT(*) AS n FROM patients").get() as { n: number };
if (countRow.n === 0) {
  const insert = db.prepare(`
    INSERT INTO patients (
      id, name, age, email, distanceKm,
      totalAppointmentCount, missedAppointmentCount,
      daysSinceLastVisit, expectedFrequencyDays,
      treatmentElapsedDays, treatmentTotalDays
    ) VALUES (
      :id, :name, :age, :email, :distanceKm,
      :totalAppointmentCount, :missedAppointmentCount,
      :daysSinceLastVisit, :expectedFrequencyDays,
      :treatmentElapsedDays, :treatmentTotalDays
    )
  `);

  for (const p of seedPatients) {
    insert.run({
      id: p.id,
      name: p.name,
      age: p.age,
      email: p.email ?? null,
      distanceKm: p.distanceKm,
      totalAppointmentCount: p.totalAppointmentCount,
      missedAppointmentCount: p.missedAppointmentCount,
      daysSinceLastVisit: p.daysSinceLastVisit,
      expectedFrequencyDays: p.expectedFrequencyDays,
      treatmentElapsedDays: p.treatmentElapsedDays,
      treatmentTotalDays: p.treatmentTotalDays,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`[patientStore] Seeded ${seedPatients.length} patients into ${DB_PATH}`);
} else {
  // Backfill emails for pre-existing seed rows that predate the email
  // column (keeps old DB files usable for the bulk-email demo).
  const backfill = db.prepare(
    "UPDATE patients SET email = :email WHERE id = :id AND (email IS NULL OR email = '')"
  );
  for (const p of seedPatients) {
    if (p.email) backfill.run({ id: p.id, email: p.email });
  }
}

// ---------------------------------------------------------------------------
// Public API — patients
// ---------------------------------------------------------------------------

/** Return all patients from the DB. */
export function getAllPatients(): Patient[] {
  return db.prepare("SELECT * FROM patients").all() as unknown as Patient[];
}

/** Return a single patient by ID, or undefined if not found. */
export function getPatientById(id: string): Patient | undefined {
  return db.prepare("SELECT * FROM patients WHERE id = ?").get(id) as unknown as
    | Patient
    | undefined;
}

/** Return multiple patients by ID, in no particular order. */
export function getPatientsByIds(ids: string[]): Patient[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .prepare(`SELECT * FROM patients WHERE id IN (${placeholders})`)
    .all(...ids) as unknown as Patient[];
}

/**
 * Insert-or-update patients from a bulk CSV upload. Returns which ids were
 * brand new vs. updated existing records, so the upload analytics can
 * report both counts.
 */
export function upsertPatients(patients: Patient[]): {
  newIds: string[];
  updatedIds: string[];
} {
  const newIds: string[] = [];
  const updatedIds: string[] = [];

  const existsStmt = db.prepare("SELECT 1 FROM patients WHERE id = ?");
  const insertStmt = db.prepare(`
    INSERT INTO patients (
      id, name, age, email, distanceKm,
      totalAppointmentCount, missedAppointmentCount,
      daysSinceLastVisit, expectedFrequencyDays,
      treatmentElapsedDays, treatmentTotalDays
    ) VALUES (
      :id, :name, :age, :email, :distanceKm,
      :totalAppointmentCount, :missedAppointmentCount,
      :daysSinceLastVisit, :expectedFrequencyDays,
      :treatmentElapsedDays, :treatmentTotalDays
    )
  `);
  const updateStmt = db.prepare(`
    UPDATE patients SET
      name = :name,
      age = :age,
      email = :email,
      distanceKm = :distanceKm,
      totalAppointmentCount = :totalAppointmentCount,
      missedAppointmentCount = :missedAppointmentCount,
      daysSinceLastVisit = :daysSinceLastVisit,
      expectedFrequencyDays = :expectedFrequencyDays,
      treatmentElapsedDays = :treatmentElapsedDays,
      treatmentTotalDays = :treatmentTotalDays
    WHERE id = :id
  `);

  for (const p of patients) {
    const params = {
      id: p.id,
      name: p.name,
      age: p.age,
      email: p.email ?? null,
      distanceKm: p.distanceKm,
      totalAppointmentCount: p.totalAppointmentCount,
      missedAppointmentCount: p.missedAppointmentCount,
      daysSinceLastVisit: p.daysSinceLastVisit,
      expectedFrequencyDays: p.expectedFrequencyDays,
      treatmentElapsedDays: p.treatmentElapsedDays,
      treatmentTotalDays: p.treatmentTotalDays,
    };

    const exists = existsStmt.get(p.id);
    if (exists) {
      updateStmt.run(params);
      updatedIds.push(p.id);
    } else {
      insertStmt.run(params);
      newIds.push(p.id);
    }
  }

  return { newIds, updatedIds };
}
