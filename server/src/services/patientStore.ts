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
// Enforce exactly the 18 seed patients on every startup
//
// This ensures the deployed app always shows only the intended demo data:
//   1. Delete any patient rows whose ID is not in the seed list
//      (removes data that was written by a previous CSV upload).
//   2. Upsert all 18 seed patients so they always reflect canonical values.
//   3. Clear the uploads table so the upload history is always fresh.
// ---------------------------------------------------------------------------

const seedIds = seedPatients.map((p) => p.id);
const seedIdPlaceholders = seedIds.map(() => "?").join(",");

// Step 1 — remove any non-seed patients (e.g. from a previously uploaded CSV)
const deletedNonSeed = db
  .prepare(`DELETE FROM patients WHERE id NOT IN (${seedIdPlaceholders})`)
  .run(...seedIds);
if (deletedNonSeed.changes > 0) {
  // eslint-disable-next-line no-console
  console.log(`[patientStore] Removed ${deletedNonSeed.changes} non-seed patient(s) from ${DB_PATH}`);
}

// Step 2 — upsert all 18 seeds (insert if missing, update if present)
const upsertSeed = db.prepare(`
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
  ON CONFLICT(id) DO UPDATE SET
    name                   = excluded.name,
    age                    = excluded.age,
    email                  = excluded.email,
    distanceKm             = excluded.distanceKm,
    totalAppointmentCount  = excluded.totalAppointmentCount,
    missedAppointmentCount = excluded.missedAppointmentCount,
    daysSinceLastVisit     = excluded.daysSinceLastVisit,
    expectedFrequencyDays  = excluded.expectedFrequencyDays,
    treatmentElapsedDays   = excluded.treatmentElapsedDays,
    treatmentTotalDays     = excluded.treatmentTotalDays
`);

for (const p of seedPatients) {
  upsertSeed.run({
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

// Step 3 — clear the uploads table so history is always fresh on startup
db.exec("DELETE FROM uploads");

// eslint-disable-next-line no-console
console.log(`[patientStore] Reset to ${seedPatients.length} seed patients; upload history cleared.`);

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
