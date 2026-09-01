import { Router, Request, Response } from "express";
import { getAllPatients, getPatientById } from "../services/patientStore";
import { computeRisk } from "../services/scoringEngine";
import { generateCallScript } from "../services/callScriptService";
import { getCallHistory, getLastCallByPatient, logCall } from "../services/callStore";
import { CallOutcome, CallQueueItem } from "../types/call";

const router = Router();

const VALID_OUTCOMES: CallOutcome[] = [
  "Contacted - will attend",
  "Contacted - rescheduled",
  "No answer",
  "Left voicemail",
  "Declined / refused",
];

// GET /api/call-list — High + Medium risk patients, ranked, each with a
// ready-to-read dialogue and their most recent call outcome (if any).
router.get("/call-list", (_req: Request, res: Response) => {
  const patients = getAllPatients();
  const lastCalls = getLastCallByPatient();

  const items: CallQueueItem[] = patients
    .map((p) => {
      const risk = computeRisk(p);
      return { patient: p, risk };
    })
    .filter(({ risk }) => risk.tier === "High" || risk.tier === "Medium")
    .sort((a, b) => (b.risk.score ?? 0) - (a.risk.score ?? 0))
    .map(({ patient, risk }) => ({
      patientId: patient.id,
      patientName: patient.name,
      score: risk.score,
      tier: risk.tier,
      topReasonLabel: risk.topReasonLabel,
      script: generateCallScript(patient, risk),
      lastCall: lastCalls.get(patient.id) ?? null,
    }));

  res.json(items);
});

// POST /api/call-log — { patientId, outcome, notes? }
router.post("/call-log", (req: Request, res: Response) => {
  const { patientId, outcome, notes } = req.body ?? {};

  if (!patientId || typeof patientId !== "string") {
    return res.status(400).json({ error: "patientId is required" });
  }
  if (!getPatientById(patientId)) {
    return res.status(404).json({ error: `Patient ${patientId} not found` });
  }
  if (!VALID_OUTCOMES.includes(outcome)) {
    return res.status(400).json({ error: `outcome must be one of: ${VALID_OUTCOMES.join(", ")}` });
  }

  const entry = logCall(patientId, outcome, typeof notes === "string" ? notes : null);
  res.status(201).json(entry);
});

// GET /api/call-log/:patientId — call history for one patient
router.get("/call-log/:patientId", (req: Request, res: Response) => {
  res.json(getCallHistory(req.params.patientId));
});

export default router;
