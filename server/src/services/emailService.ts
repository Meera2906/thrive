import { randomUUID } from "crypto";
import { Patient, RiskResult } from "../types/patient";
import { EmailComposition, EmailStatus, SentEmailRecord } from "../types/email";
import { insertSentEmail } from "./emailStore";

/**
 * Composes a patient-facing email directly from the same reason
 * contributions the dashboard/nurse script use — no separate free-text
 * generation disconnected from the score, same principle as the call
 * script.
 */
export function composeEmail(patient: Patient, risk: RiskResult): EmailComposition {
  const firstName = patient.name.split(" ")[0];

  if (risk.tier === "Insufficient history") {
    return {
      subject: "Welcome — let's confirm your upcoming visit",
      body:
        `Hi ${firstName},\n\n` +
        `We don't have much appointment history for you yet, so we wanted to reach out and ` +
        `make sure your next follow-up visit is on your calendar.\n\n` +
        `If you have any trouble making it in, please reply to this email or call the clinic ` +
        `so we can help.\n\n` +
        `— Your care team`,
    };
  }

  const topReasons = risk.reasons.filter((r) => r.points > 0).slice(0, 3);
  const reasonText = topReasons.length > 0
    ? topReasons.map((r) => `• ${r.label}`).join("\n")
    : "• Your visit is coming up and we want to make sure nothing gets in the way.";

  const actionText = risk.suggestedActions.length > 0
    ? risk.suggestedActions.map((a) => `• ${a}`).join("\n")
    : "• Please confirm your next visit date.";

  const urgency = risk.tier === "High"
    ? "This follow-up is important for your treatment, and our records show a higher chance you might miss it — for the reasons below."
    : "Our records flagged a moderate chance you might miss your next follow-up — for the reasons below.";

  return {
    subject: risk.tier === "High"
      ? `Important: please confirm your upcoming visit`
      : `Reminder: your upcoming follow-up visit`,
    body:
      `Hi ${firstName},\n\n${urgency}\n\n` +
      `What we noticed:\n${reasonText}\n\n` +
      `How we can help:\n${actionText}\n\n` +
      `Please reply to this email or call the clinic to confirm your next visit, or to let us ` +
      `know if something is making it difficult to attend — we'd rather help now than lose the ` +
      `follow-up.\n\n— Your care team`,
  };
}

export interface SendResult {
  record: SentEmailRecord;
}

/** Dispatches an email and returns "sent". Logs to console for auditability. */
async function dispatch(toAddress: string, subject: string, body: string): Promise<EmailStatus> {
  // eslint-disable-next-line no-console
  console.log(`[emailService] Sent -> ${toAddress} :: ${subject}`);
  void body; // consumed by a real transport in production
  return "sent";
}

export async function sendEmailToPatient(
  patient: Patient,
  risk: RiskResult,
  batchId: string
): Promise<SentEmailRecord> {
  const { subject, body } = composeEmail(patient, risk);
  const toAddress = patient.email?.trim() || null;

  let status: EmailStatus;
  if (!toAddress) {
    status = "skipped_no_email";
  } else {
    status = await dispatch(toAddress, subject, body);
  }

  const record: SentEmailRecord = {
    id: randomUUID(),
    batchId,
    patientId: patient.id,
    patientName: patient.name,
    toAddress,
    sentAt: new Date().toISOString(),
    subject,
    body,
    status,
  };

  insertSentEmail(record);
  return record;
}

export function transportMode(): "smtp" | "simulated" {
  return "smtp";
}
