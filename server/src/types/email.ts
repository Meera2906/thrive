// Types for the bulk-email-to-at-risk-patients feature.

export type EmailStatus = "sent" | "simulated" | "failed" | "skipped_no_email";

export interface EmailComposition {
  subject: string;
  body: string;
}

export interface SentEmailRecord {
  id: string;
  batchId: string;
  patientId: string;
  patientName: string;
  toAddress: string | null;
  sentAt: string; // ISO timestamp
  subject: string;
  body: string;
  status: EmailStatus;
}

export interface BulkEmailRequest {
  patientIds: string[];
}

export interface BulkEmailResult {
  batchId: string;
  requested: number;
  sent: number;
  simulated: number;
  skippedNoEmail: number;
  failed: number;
  records: SentEmailRecord[];
  transport: "smtp" | "simulated"; // whether real SMTP creds were configured
}
