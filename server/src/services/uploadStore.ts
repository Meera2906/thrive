import { randomUUID } from "crypto";
import { db, deletePatientsByUploadId } from "./patientStore";
import { UploadAnalytics, UploadRecord, RowError } from "../types/upload";

/**
 * Persists the raw uploaded file as a BLOB alongside the analytics snapshot.
 */
export function saveUpload(
  id: string,
  filename: string,
  rawBuffer: Buffer,
  analytics: UploadAnalytics,
  errors: RowError[]
): UploadRecord {
  const uploadedAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO uploads (id, filename, uploadedAt, sizeBytes, rawBlob, analyticsJson, errorsJson)
     VALUES (:id, :filename, :uploadedAt, :sizeBytes, :rawBlob, :analyticsJson, :errorsJson)`
  ).run({
    id,
    filename,
    uploadedAt,
    sizeBytes: rawBuffer.byteLength,
    rawBlob: rawBuffer,
    analyticsJson: JSON.stringify(analytics),
    errorsJson: JSON.stringify(errors),
  });

  return { id, filename, uploadedAt, sizeBytes: rawBuffer.byteLength, analytics, errors };
}

type UploadRow = {
  id: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number;
  analyticsJson: string;
  errorsJson: string;
};

function rowToRecord(row: UploadRow): UploadRecord {
  return {
    id: row.id,
    filename: row.filename,
    uploadedAt: row.uploadedAt,
    sizeBytes: row.sizeBytes,
    analytics: JSON.parse(row.analyticsJson) as UploadAnalytics,
    errors: JSON.parse(row.errorsJson) as RowError[],
  };
}

/** List uploads, newest first, WITHOUT the raw blob (keeps list responses small). */
export function listUploads(): UploadRecord[] {
  const rows = db
    .prepare(
      `SELECT id, filename, uploadedAt, sizeBytes, analyticsJson, errorsJson
       FROM uploads ORDER BY uploadedAt DESC`
    )
    .all() as unknown as UploadRow[];
  return rows.map(rowToRecord);
}

export function getUploadById(id: string): UploadRecord | undefined {
  const row = db
    .prepare(
      `SELECT id, filename, uploadedAt, sizeBytes, analyticsJson, errorsJson
       FROM uploads WHERE id = ?`
    )
    .get(id) as unknown as UploadRow | undefined;
  return row ? rowToRecord(row) : undefined;
}

/** Fetch the original raw file bytes back out of the BLOB column. */
export function getUploadBlob(id: string): { filename: string; buffer: Buffer } | undefined {
  const row = db
    .prepare(`SELECT filename, rawBlob FROM uploads WHERE id = ?`)
    .get(id) as unknown as { filename: string; rawBlob: Buffer } | undefined;
  if (!row) return undefined;
  return { filename: row.filename, buffer: Buffer.from(row.rawBlob) };
}

/** Delete an upload record (and its raw blob and uploaded patients) by ID. Returns true if a row was deleted. */
export function deleteUpload(id: string): boolean {
  deletePatientsByUploadId(id);
  const result = db.prepare(`DELETE FROM uploads WHERE id = ?`).run(id);
  return Number(result.changes) > 0;
}


