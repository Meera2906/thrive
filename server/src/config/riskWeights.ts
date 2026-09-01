// All scoring weights, caps, thresholds, and lookup rules live here so
// clinical/ops staff can tune the model without touching engine logic.

export const COLD_START_MIN_APPOINTMENTS = 2;

export const SCORE_CAP = 100;

export const TIER_THRESHOLDS = {
  high: 55, // score >= 55 -> High
  medium: 30, // score >= 30 -> Medium
  // else -> Low
};

export const WEIGHTS = {
  missedRatio: {
    max: 35,
  },
  overdue: {
    max: 20,
    clampMin: 0,
    clampMax: 1.5, // ratio clamp before scaling to points
  },
  distance: {
    max: 15,
    farKm: 40,
    farPoints: 15,
    midKm: 20,
    midPoints: 8,
  },
  fatigue: {
    max: 15,
    highRatio: 0.7,
    highPoints: 15,
    midRatio: 0.4,
    midPoints: 6, // round(15 * 0.4)
  },
  age: {
    max: 10,
    seniorAge: 65,
    seniorPoints: 10,
    youngAge: 30,
    youngPoints: 5,
  },
  frequency: {
    max: 5,
    thresholdDays: 14,
    points: 5,
  },
} as const;

/** Suggested next action for each factor category, keyed the same way
 * the scoring engine keys its reason contributions. Age is split into
 * two sub-keys since senior vs. young patients need different actions. */
export const ACTIONS: Record<string, string> = {
  missedRatio: "Call to confirm attendance and address any recurring barrier",
  overdue: "Priority reminder call — patient is already overdue",
  distance: "Offer a teleconsult or transport assistance option",
  fatigue: "Check in on treatment fatigue; consider a supportive call",
  ageSenior: "Offer transport assistance or a home/tele visit",
  ageYoung: "Send an engagement-focused reminder",
  frequency: "Consider consolidating visits or adding reminder cadence",
};

export const COLD_START_ACTION = "Flag for manual review at first follow-up";
export const NO_ELEVATED_RISK_ACTION = "Continue standard follow-up care";
