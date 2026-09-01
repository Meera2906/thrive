import {
  ACTIONS,
  COLD_START_ACTION,
  COLD_START_MIN_APPOINTMENTS,
  NO_ELEVATED_RISK_ACTION,
  SCORE_CAP,
  TIER_THRESHOLDS,
  WEIGHTS,
} from "../config/riskWeights";
import {
  FactorKey,
  Patient,
  ReasonContribution,
  RiskResult,
  RiskTier,
} from "../types/patient";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value);
}

function tierForScore(score: number): RiskTier {
  if (score >= TIER_THRESHOLDS.high) return "High";
  if (score >= TIER_THRESHOLDS.medium) return "Medium";
  return "Low";
}

/** Factor 1: Missed-ratio — round((missed / total) * 35), max 35 */
function missedRatioFactor(p: Patient): ReasonContribution {
  const { missedAppointmentCount: missed, totalAppointmentCount: total } = p;
  const ratio = total > 0 ? missed / total : 0;
  const points = clamp(round(ratio * WEIGHTS.missedRatio.max), 0, WEIGHTS.missedRatio.max);
  const pct = round(ratio * 100);
  return {
    key: "missedRatio",
    label: `Missed ${missed} of ${total} past visits (${pct}%)`,
    points,
    maxPoints: WEIGHTS.missedRatio.max,
  };
}

/** Factor 2: Overdue-ness — round(clamp((days_since_last / frequency) - 1, 0, 1.5) * 20), max 20 */
function overdueFactor(p: Patient): ReasonContribution {
  const { daysSinceLastVisit, expectedFrequencyDays: frequency } = p;
  const raw = frequency > 0 ? daysSinceLastVisit / frequency - 1 : 0;
  const clamped = clamp(raw, WEIGHTS.overdue.clampMin, WEIGHTS.overdue.clampMax);
  const points = round(clamped * WEIGHTS.overdue.max);
  const overduePct = round(clamped * 100);
  return {
    key: "overdue",
    label: `${daysSinceLastVisit} days since last visit, expected every ${frequency} days (${overduePct}% overdue)`,
    points,
    maxPoints: WEIGHTS.overdue.max,
  };
}

/** Factor 3: Distance — 15 if > 40km, 8 if > 20km, else 0 */
function distanceFactor(p: Patient): ReasonContribution {
  const { distanceKm } = p;
  let points = 0;
  let label: string;
  if (distanceKm > WEIGHTS.distance.farKm) {
    points = WEIGHTS.distance.farPoints;
    label = `Lives ${distanceKm} km from hospital (> 40 km threshold)`;
  } else if (distanceKm > WEIGHTS.distance.midKm) {
    points = WEIGHTS.distance.midPoints;
    label = `Lives ${distanceKm} km from hospital (20-40 km threshold)`;
  } else {
    label = `Lives ${distanceKm} km from hospital (within 20 km, no distance risk)`;
  }
  return { key: "distance", label, points, maxPoints: WEIGHTS.distance.max };
}

/** Factor 4: Treatment fatigue — 15 if elapsed/total > 0.7, 6 if > 0.4, else 0 */
function fatigueFactor(p: Patient): ReasonContribution {
  const { treatmentElapsedDays: elapsed, treatmentTotalDays: total } = p;
  const ratio = total > 0 ? elapsed / total : 0;
  const pct = round(ratio * 100);
  let points = 0;
  let threshold = 40;
  if (ratio > WEIGHTS.fatigue.highRatio) {
    points = WEIGHTS.fatigue.highPoints;
    threshold = 70;
  } else if (ratio > WEIGHTS.fatigue.midRatio) {
    points = WEIGHTS.fatigue.midPoints;
    threshold = 40;
  }
  return {
    key: "fatigue",
    label: `Completed ${pct}% of treatment course (fatigue risk > ${threshold}%)`,
    points,
    maxPoints: WEIGHTS.fatigue.max,
  };
}

/** Factor 5: Age band — 10 if >= 65, 5 if <= 30, else 0 */
function ageFactor(p: Patient): ReasonContribution {
  const { age } = p;
  let points = 0;
  let label: string;
  if (age >= WEIGHTS.age.seniorAge) {
    points = WEIGHTS.age.seniorPoints;
    label = `Age ${age} (higher mobility/transport risk for 65+)`;
  } else if (age <= WEIGHTS.age.youngAge) {
    points = WEIGHTS.age.youngPoints;
    label = `Age ${age} (historically lower adherence age group <= 30)`;
  } else {
    label = `Age ${age} (no elevated age-related risk)`;
  }
  return { key: "age", label, points, maxPoints: WEIGHTS.age.max };
}

/** Factor 6: Visit frequency — 5 if frequency_days <= 14, else 0 */
function frequencyFactor(p: Patient): ReasonContribution {
  const { expectedFrequencyDays: frequency } = p;
  const isFrequent = frequency <= WEIGHTS.frequency.thresholdDays;
  return {
    key: "frequency",
    label: isFrequent
      ? `Frequent visits required (every ${frequency} days)`
      : `Standard visit cadence (every ${frequency} days)`,
    points: isFrequent ? WEIGHTS.frequency.points : 0,
    maxPoints: WEIGHTS.frequency.max,
  };
}

function actionKeyFor(reason: ReasonContribution, patient: Patient): string | null {
  switch (reason.key) {
    case "missedRatio":
      return ACTIONS.missedRatio;
    case "overdue":
      return ACTIONS.overdue;
    case "distance":
      return ACTIONS.distance;
    case "fatigue":
      return ACTIONS.fatigue;
    case "age":
      return patient.age >= WEIGHTS.age.seniorAge
        ? ACTIONS.ageSenior
        : patient.age <= WEIGHTS.age.youngAge
        ? ACTIONS.ageYoung
        : null;
    case "frequency":
      return ACTIONS.frequency;
    default:
      return null;
  }
}

/**
 * Computes a transparent, explainable risk result for a single patient.
 * Cold-start rule is evaluated FIRST and short-circuits everything else.
 */
export function computeRisk(patient: Patient): RiskResult {
  if (patient.totalAppointmentCount < COLD_START_MIN_APPOINTMENTS) {
    const reason: ReasonContribution = {
      key: "coldStart",
      label: "Insufficient appointment history (< 2 appointments recorded)",
      points: 0,
      maxPoints: 0,
    };
    return {
      score: null,
      tier: "Insufficient history",
      reasons: [reason],
      suggestedActions: [COLD_START_ACTION],
      topReasonLabel: reason.label,
    };
  }

  const reasons: ReasonContribution[] = [
    missedRatioFactor(patient),
    overdueFactor(patient),
    distanceFactor(patient),
    fatigueFactor(patient),
    ageFactor(patient),
    frequencyFactor(patient),
  ];

  const rawTotal = reasons.reduce((sum, r) => sum + r.points, 0);
  const score = clamp(rawTotal, 0, SCORE_CAP);
  const tier = tierForScore(score);

  // Rank factors by points descending (stable) to pick top drivers.
  const ranked = [...reasons].sort((a, b) => b.points - a.points);
  const topDrivers = ranked.filter((r) => r.points > 0).slice(0, 2);

  const suggestedActions = topDrivers
    .map((r) => actionKeyFor(r, patient))
    .filter((a): a is string => Boolean(a));

  const uniqueActions = Array.from(new Set(suggestedActions));

  return {
    score,
    tier,
    reasons: ranked,
    suggestedActions: uniqueActions.length > 0 ? uniqueActions : [NO_ELEVATED_RISK_ACTION],
    topReasonLabel: ranked[0]?.points > 0 ? ranked[0].label : ranked[0]?.label ?? null,
  };
}
