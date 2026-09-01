import { Router, Request, Response } from "express";
import { getAllPatients, getPatientById } from "../services/patientStore";
import { computeRisk } from "../services/scoringEngine";
import { PatientWithRisk, StatsResponse } from "../types/patient";

const router = Router();

function buildPatientsWithRisk(): PatientWithRisk[] {
  return getAllPatients().map((p) => ({ ...p, risk: computeRisk(p) }));
}

/** Sort: cold-start ("Insufficient history") always last, regardless of
 * its placeholder score, then by score descending among the rest. */
function sortByRiskDescending(patients: PatientWithRisk[]): PatientWithRisk[] {
  return [...patients].sort((a, b) => {
    const aCold = a.risk.tier === "Insufficient history";
    const bCold = b.risk.tier === "Insufficient history";
    if (aCold && !bCold) return 1;
    if (!aCold && bCold) return -1;
    if (aCold && bCold) return 0;
    return (b.risk.score ?? 0) - (a.risk.score ?? 0);
  });
}

// GET /api/patients — full ranked list
router.get("/patients", (_req: Request, res: Response) => {
  const patients = sortByRiskDescending(buildPatientsWithRisk());
  res.json(patients);
});

// GET /api/patients/:id — single patient detail
router.get("/patients/:id", (req: Request, res: Response) => {
  const patient = getPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: `Patient ${req.params.id} not found` });
  }
  res.json({ ...patient, risk: computeRisk(patient) });
});

// GET /api/stats — summary counts by tier
router.get("/stats", (_req: Request, res: Response) => {
  const patients = buildPatientsWithRisk();
  const stats: StatsResponse = {
    total: patients.length,
    high: patients.filter((p) => p.risk.tier === "High").length,
    medium: patients.filter((p) => p.risk.tier === "Medium").length,
    low: patients.filter((p) => p.risk.tier === "Low").length,
    insufficientHistory: patients.filter((p) => p.risk.tier === "Insufficient history").length,
  };
  res.json(stats);
});

export default router;
