import { randomUUID } from "crypto";
import { Router, Request, Response } from "express";
import { getAllPatients, getPatientsByIds } from "../services/patientStore";
import { computeRisk } from "../services/scoringEngine";
import { composeEmail, sendEmailToPatient, transportMode } from "../services/emailService";
import { listSentEmails, listSentEmailsForBatch } from "../services/emailStore";
import { BulkEmailResult } from "../types/email";

const router = Router();

// GET /api/emails/preview?patientId=P001 — see the exact composed email
// before sending, so staff can sanity-check the wording.
router.get("/emails/preview", (req: Request, res: Response) => {
  const patientId = req.query.patientId as string | undefined;
  if (!patientId) return res.status(400).json({ error: "patientId query param is required" });

  const [patient] = getPatientsByIds([patientId]);
  if (!patient) return res.status(404).json({ error: `Patient ${patientId} not found` });

  const risk = computeRisk(patient);
  const composition = composeEmail(patient, risk);
  res.json({ patientId, toAddress: patient.email ?? null, ...composition });
});

// GET /api/emails/at-risk — convenience list of High/Medium patients with
// an email on file, for the bulk-email patient picker.
router.get("/emails/at-risk", (_req: Request, res: Response) => {
  const items = getAllPatients()
    .map((p) => ({ patient: p, risk: computeRisk(p) }))
    .filter(({ risk }) => risk.tier === "High" || risk.tier === "Medium")
    .sort((a, b) => (b.risk.score ?? 0) - (a.risk.score ?? 0))
    .map(({ patient, risk }) => ({
      id: patient.id,
      name: patient.name,
      email: patient.email ?? null,
      score: risk.score,
      tier: risk.tier,
      topReasonLabel: risk.topReasonLabel,
    }));
  res.json(items);
});

// POST /api/emails/bulk — { patientIds: string[] }
router.post("/emails/bulk", async (req: Request, res: Response) => {
  const { patientIds } = req.body ?? {};
  if (!Array.isArray(patientIds) || patientIds.length === 0) {
    return res.status(400).json({ error: "patientIds must be a non-empty array" });
  }

  const patients = getPatientsByIds(patientIds);
  const batchId = randomUUID();

  const records = [];
  for (const patient of patients) {
    const risk = computeRisk(patient);
    // Sequential, not Promise.all — keeps simulated console logs readable
    // and avoids hammering a real SMTP server if one is configured.
    // eslint-disable-next-line no-await-in-loop
    const record = await sendEmailToPatient(patient, risk, batchId);
    records.push(record);
  }

  const result: BulkEmailResult = {
    batchId,
    requested: patientIds.length,
    sent: records.filter((r) => r.status === "sent").length,
    simulated: records.filter((r) => r.status === "simulated").length,
    skippedNoEmail: records.filter((r) => r.status === "skipped_no_email").length,
    failed: records.filter((r) => r.status === "failed").length,
    records,
    transport: transportMode(),
  };

  res.status(201).json(result);
});

// GET /api/emails/history — recent sent-email audit log
router.get("/emails/history", (_req: Request, res: Response) => {
  res.json(listSentEmails());
});

// GET /api/emails/batch/:batchId — all emails from one bulk-send batch
router.get("/emails/batch/:batchId", (req: Request, res: Response) => {
  res.json(listSentEmailsForBatch(req.params.batchId));
});

export default router;
