import { randomUUID } from "crypto";
import { parseCsv } from "./csvParser";
import { upsertPatients } from "./patientStore";
import { saveUpload } from "./uploadStore";
import { computeRisk } from "./scoringEngine";
import { Patient } from "../types/patient";
import { RowError, UploadAnalytics, UploadRecord } from "../types/upload";

const REQUIRED_COLUMNS = ["id", "name"] as const;

const NUMERIC_COLUMNS: Array<keyof Patient> = [
  "age",
  "distanceKm",
  "totalAppointmentCount",
  "missedAppointmentCount",
  "daysSinceLastVisit",
  "expectedFrequencyDays",
  "treatmentElapsedDays",
  "treatmentTotalDays",
];

/** Sensible defaults so a partial hospital export (missing distance or
 * treatment-duration columns, for example) still parses instead of failing
 * the whole row — matches the original design note that distance/duration
 * are often unavailable and may need to be simulated/backfilled. */
const DEFAULTS: Record<string, number> = {
  age: 40,
  distanceKm: 0,
  totalAppointmentCount: 0,
  missedAppointmentCount: 0,
  daysSinceLastVisit: 0,
  expectedFrequencyDays: 21,
  treatmentElapsedDays: 0,
  treatmentTotalDays: 90,
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parses a CSV buffer, validates + coerces each row into a Patient, upserts
 * valid rows into the patient store, computes instant tier/score analytics
 * over the parsed batch, and persists the raw file as a BLOB for audit.
 */
export function processUpload(filename: string, buffer: Buffer): UploadRecord {
  // Generate the upload ID upfront so we can tag patient rows with it,
  // enabling precise cleanup when this upload is later deleted.
  const uploadId = randomUUID();
  const text = buffer.toString("utf-8");
  const { headers, rows } = parseCsv(text);

  const errors: RowError[] = [];
  const validPatients: Patient[] = [];

  const missingRequired = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missingRequired.length > 0) {
    errors.push({
      row: 0,
      message: `CSV is missing required column(s): ${missingRequired.join(", ")}. Expected at minimum: id, name.`,
    });
  } else {
    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // +1 for 1-index, +1 for header row
      const id = row.id?.trim();
      const name = row.name?.trim();

      if (!id) {
        errors.push({ row: rowNum, message: "Missing required field 'id' — row skipped." });
        return;
      }
      if (!name) {
        errors.push({ row: rowNum, message: `Missing required field 'name' for id ${id} — row skipped.` });
        return;
      }

      const patient: Patient = {
        id,
        name,
        email: row.email?.trim() || null,
        age: parseNumber(row.age, DEFAULTS.age),
        distanceKm: parseNumber(row.distanceKm, DEFAULTS.distanceKm),
        totalAppointmentCount: parseNumber(row.totalAppointmentCount, DEFAULTS.totalAppointmentCount),
        missedAppointmentCount: parseNumber(row.missedAppointmentCount, DEFAULTS.missedAppointmentCount),
        daysSinceLastVisit: parseNumber(row.daysSinceLastVisit, DEFAULTS.daysSinceLastVisit),
        expectedFrequencyDays: parseNumber(row.expectedFrequencyDays, DEFAULTS.expectedFrequencyDays),
        treatmentElapsedDays: parseNumber(row.treatmentElapsedDays, DEFAULTS.treatmentElapsedDays),
        treatmentTotalDays: parseNumber(row.treatmentTotalDays, DEFAULTS.treatmentTotalDays),
      };

      // Sanity check numeric columns didn't come through as garbage text
      // that silently fell back to defaults when the field was non-empty.
      NUMERIC_COLUMNS.forEach((col) => {
        const raw = row[col as string];
        if (raw && raw.trim() !== "" && !Number.isFinite(Number(raw))) {
          errors.push({
            row: rowNum,
            message: `Column '${String(col)}' for id ${id} is not a number ("${raw}") — used default instead.`,
          });
        }
      });

      validPatients.push(patient);
    });
  }

  const { newIds, updatedIds } = validPatients.length > 0
    ? upsertPatients(validPatients, uploadId)
    : { newIds: [], updatedIds: [] };

  // Instant analytics — same scoring engine the dashboard uses, so the
  // "analytics instantly" numbers always match what staff see afterward.
  const scored = validPatients.map((p) => ({ patient: p, risk: computeRisk(p) }));

  const tierCounts = {
    high: scored.filter((s) => s.risk.tier === "High").length,
    medium: scored.filter((s) => s.risk.tier === "Medium").length,
    low: scored.filter((s) => s.risk.tier === "Low").length,
    insufficientHistory: scored.filter((s) => s.risk.tier === "Insufficient history").length,
  };

  const scoredValues = scored.map((s) => s.risk.score).filter((s): s is number => s !== null);
  const averageScore =
    scoredValues.length > 0
      ? Math.round((scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length) * 10) / 10
      : null;

  const topRiskPatientIds = [...scored]
    .filter((s) => s.risk.score !== null)
    .sort((a, b) => (b.risk.score ?? 0) - (a.risk.score ?? 0))
    .slice(0, 5)
    .map((s) => s.patient.id);

  const analytics: UploadAnalytics = {
    rowCount: rows.length,
    validCount: validPatients.length,
    errorCount: errors.length,
    newPatientCount: newIds.length,
    updatedPatientCount: updatedIds.length,
    tierCounts,
    averageScore,
    topRiskPatientIds,
  };

  return saveUpload(uploadId, filename, buffer, analytics, errors);
}
