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

const db = new DatabaseSync(DB_PATH);

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
// Idempotent seed — only runs on a truly empty table
// ---------------------------------------------------------------------------

const countRow = db.prepare("SELECT COUNT(*) AS n FROM patients").get() as { n: number };
if (countRow.n === 0) {
  const insert = db.prepare(`
    INSERT INTO patients (
      id, name, age, distanceKm,
      totalAppointmentCount, missedAppointmentCount,
      daysSinceLastVisit, expectedFrequencyDays,
      treatmentElapsedDays, treatmentTotalDays
    ) VALUES (
      :id, :name, :age, :distanceKm,
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
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Return all patients from the DB. */
export function getAllPatients(): Patient[] {
  return db.prepare("SELECT * FROM patients").all() as unknown as Patient[];
}

/** Return a single patient by ID, or undefined if not found. */
export function getPatientById(id: string): Patient | undefined {
  return db.prepare("SELECT * FROM patients WHERE id = ?").get(id) as unknown as Patient | undefined;
}
