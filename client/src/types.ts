export type FactorKey =
  | "missedRatio"
  | "overdue"
  | "distance"
  | "fatigue"
  | "age"
  | "frequency"
  | "coldStart";

export type RiskTier = "High" | "Medium" | "Low" | "Insufficient history";

export interface ReasonContribution {
  key: FactorKey;
  label: string;
  points: number;
  maxPoints: number;
}

export interface RiskResult {
  score: number | null;
  tier: RiskTier;
  reasons: ReasonContribution[];
  suggestedActions: string[];
  topReasonLabel: string | null;
}

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

export type SortKey = "score" | "overdue" | "distance";
export type TierFilter = "All" | RiskTier;
