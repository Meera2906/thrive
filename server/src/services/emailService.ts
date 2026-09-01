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

/**
 * Sends (or simulates sending) one email and logs it. Real SMTP transport
 * is a clean extension point: wire an actual provider (nodemailer, SES,
 * SendGrid) into `dispatch()` below and set SMTP_HOST/SMTP_USER/SMTP_PASS.
 * Without those env vars configured, sends are logged as "simulated" so
 * the whole compose -> send -> audit-log pipeline is demoable without
 * real hospital email credentials.
 */
function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function dispatch(toAddress: string, subject: string, body: string): Promise<EmailStatus> {
  if (!isSmtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`[emailService] SIMULATED send -> ${toAddress} :: ${subject}`);
    return "simulated";
  }

  try {
    // Lazily required so `nodemailer` is only touched when SMTP is actually
    // configured — keeps the demo path dependency-light.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: toAddress,
      subject,
      text: body,
    });
    return "sent";
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[emailService] Send failed for ${toAddress}:`, err);
    return "failed";
  }
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
  return isSmtpConfigured() ? "smtp" : "simulated";
}
