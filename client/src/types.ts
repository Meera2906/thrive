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
  email?: string | null;
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

// ─── Bulk upload ─────────────────────────────────────────────────────────

export interface RowError {
  row: number;
  message: string;
}

export interface UploadAnalytics {
  rowCount: number;
  validCount: number;
  errorCount: number;
  newPatientCount: number;
  updatedPatientCount: number;
  tierCounts: {
    high: number;
    medium: number;
    low: number;
    insufficientHistory: number;
  };
  averageScore: number | null;
  topRiskPatientIds: string[];
}

export interface UploadRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number;
  analytics: UploadAnalytics;
  errors: RowError[];
}

// ─── Nurse call list ─────────────────────────────────────────────────────

export type CallOutcome =
  | "Contacted - will attend"
  | "Contacted - rescheduled"
  | "No answer"
  | "Left voicemail"
  | "Declined / refused";

export const CALL_OUTCOMES: CallOutcome[] = [
  "Contacted - will attend",
  "Contacted - rescheduled",
  "No answer",
  "Left voicemail",
  "Declined / refused",
];

export interface CallScript {
  opening: string;
  reasonLines: string[];
  talkingPoints: string[];
  closing: string;
}

export interface CallLogEntry {
  id: string;
  patientId: string;
  calledAt: string;
  outcome: CallOutcome;
  notes: string | null;
}

export interface CallQueueItem {
  patientId: string;
  patientName: string;
  score: number | null;
  tier: string;
  topReasonLabel: string | null;
  script: CallScript;
  lastCall: CallLogEntry | null;
}

// ─── Bulk email ──────────────────────────────────────────────────────────

export type EmailStatus = "sent" | "simulated" | "failed" | "skipped_no_email";

export interface SentEmailRecord {
  id: string;
  batchId: string;
  patientId: string;
  patientName: string;
  toAddress: string | null;
  sentAt: string;
  subject: string;
  body: string;
  status: EmailStatus;
}

export interface BulkEmailResult {
  batchId: string;
  requested: number;
  sent: number;
  simulated: number;
  skippedNoEmail: number;
  failed: number;
  records: SentEmailRecord[];
  transport: "smtp" | "simulated";
}

export interface AtRiskEmailCandidate {
  id: string;
  name: string;
  email: string | null;
  score: number | null;
  tier: RiskTier;
  topReasonLabel: string | null;
}
