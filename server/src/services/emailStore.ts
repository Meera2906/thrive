import { db } from "./patientStore";
import { SentEmailRecord } from "../types/email";

export function insertSentEmail(record: SentEmailRecord): void {
  db.prepare(
    `INSERT INTO sent_emails (id, batchId, patientId, patientName, toAddress, sentAt, subject, body, status)
     VALUES (:id, :batchId, :patientId, :patientName, :toAddress, :sentAt, :subject, :body, :status)`
  ).run({ ...record, toAddress: record.toAddress ?? null });
}

export function listSentEmails(limit = 200): SentEmailRecord[] {
  return db
    .prepare(`SELECT * FROM sent_emails ORDER BY sentAt DESC LIMIT ?`)
    .all(limit) as unknown as SentEmailRecord[];
}

export function listSentEmailsForBatch(batchId: string): SentEmailRecord[] {
  return db
    .prepare(`SELECT * FROM sent_emails WHERE batchId = ? ORDER BY sentAt DESC`)
    .all(batchId) as unknown as SentEmailRecord[];
}
