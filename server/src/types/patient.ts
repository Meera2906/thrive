// Core domain types for the Patient Follow-up Risk Predictor

export interface Patient {
  id: string;
  name: string;
  age: number;
  distanceKm: number;
  totalAppointmentCount: number;
  missedAppointmentCount: number;
  daysSinceLastVisit: number;
  expectedFrequencyDays: number;
  treatmentElapsedDays: number;
  treatmentTotalDays: number;
  /** Optional — populated from seed data or bulk CSV upload. Needed for the
   * bulk-email feature; patients without an email are simply skipped when
   * sending, never blocked from scoring/ranking. */
  email?: string | null;
}

/** One of the six scoring factors, always present in the breakdown
 * (even when it contributes 0 points) so the UI can render a fully
 * transparent bar for every factor. */
export interface ReasonContribution {
  key: FactorKey;
  label: string;
  points: number;
  maxPoints: number;
}

export type FactorKey =
  | "missedRatio"
  | "overdue"
  | "distance"
  | "fatigue"
  | "age"
  | "frequency"
  | "coldStart";

export type RiskTier = "High" | "Medium" | "Low" | "Insufficient history";

export interface RiskResult {
  score: number | null; // null is rendered as "—" (cold start only)
  tier: RiskTier;
  reasons: ReasonContribution[];
  suggestedActions: string[];
  topReasonLabel: string | null;
}

export interface PatientWithRisk extends Patient {
  risk: RiskResult;
}

export interface StatsResponse {
  total: number;
  high: number;
  medium: number;
  low: number;
  insufficientHistory: number;
}
