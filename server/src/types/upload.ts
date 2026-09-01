// Types for the bulk hospital-data upload feature.
// Raw file bytes are kept as a BLOB in SQLite (see uploadStore.ts) so an
// upload is fully re-auditable later — "what exact file produced this
// analytics snapshot" is always answerable.

export interface RowError {
  row: number; // 1-indexed, matches spreadsheet row incl. header offset
  message: string;
}

/** Instant analytics computed the moment a file finishes parsing —
 * this is what powers the "hospitals can upload large files to get
 * analytics instantly" requirement. Built from the same computeRisk()
 * engine as the dashboard, so the numbers are always consistent. */
export interface UploadAnalytics {
  rowCount: number;
  validCount: number;
  errorCount: number;
  newPatientCount: number;
  updatedPatientCount: number;
  tierCounts: {
    high: number;
    medium: number;
    low: number;
    insufficientHistory: number;
  };
  averageScore: number | null;
  topRiskPatientIds: string[]; // top 5 by score, for the instant preview
}

export interface UploadRecord {
  id: string;
  filename: string;
  uploadedAt: string; // ISO timestamp
  sizeBytes: number;
  analytics: UploadAnalytics;
  errors: RowError[];
}

/** CSV column contract for bulk upload. `id` and `name` are required;
 * everything else defaults sensibly so partial hospital exports still work. */
export const UPLOAD_CSV_COLUMNS = [
  "id",
  "name",
  "age",
  "email",
  "distanceKm",
  "totalAppointmentCount",
  "missedAppointmentCount",
  "daysSinceLastVisit",
  "expectedFrequencyDays",
  "treatmentElapsedDays",
  "treatmentTotalDays",
] as const;
