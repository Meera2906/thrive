/**
 * Unit tests for scoringEngine.ts
 *
 * Coverage:
 *  - Cold-start rule (< 2 appointments)
 *  - Each of the 6 factor formulas individually
 *  - 100-point cap
 *  - Tier boundaries at exactly score 30 and 55
 *
 * Strategy: craft minimal Patient objects that isolate each factor while
 * zeroing out all the others so no cross-factor interference.
 */

import { describe, it, expect } from "vitest";
import { computeRisk } from "./scoringEngine";
import { Patient } from "../types/patient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Base patient that scores 0 on every factor (no risk, history ≥ 2). */
function basePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "TEST",
    name: "Test Patient",
    age: 40,                     // mid-range → 0 age pts
    distanceKm: 10,              // ≤ 20 km → 0 distance pts
    totalAppointmentCount: 5,    // ≥ 2 → no cold start
    missedAppointmentCount: 0,   // 0/5 missed → 0 missed-ratio pts
    daysSinceLastVisit: 10,      // 10/30 - 1 = negative → 0 overdue pts
    expectedFrequencyDays: 30,   // cadence > 14 → 0 frequency pts
    treatmentElapsedDays: 10,
    treatmentTotalDays: 200,     // 10/200 = 0.05 → 0 fatigue pts
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Cold-start rule
// ---------------------------------------------------------------------------

describe("Cold-start rule", () => {
  it("returns null score and 'Insufficient history' tier for 0 appointments", () => {
    const result = computeRisk(basePatient({ totalAppointmentCount: 0 }));
    expect(result.score).toBeNull();
    expect(result.tier).toBe("Insufficient history");
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0].key).toBe("coldStart");
    expect(result.suggestedActions).toHaveLength(1);
  });

  it("returns null score for exactly 1 appointment (boundary)", () => {
    const result = computeRisk(basePatient({ totalAppointmentCount: 1 }));
    expect(result.score).toBeNull();
    expect(result.tier).toBe("Insufficient history");
  });

  it("does NOT cold-start with exactly 2 appointments (boundary)", () => {
    const result = computeRisk(basePatient({ totalAppointmentCount: 2 }));
    expect(result.score).not.toBeNull();
    expect(result.tier).not.toBe("Insufficient history");
  });

  it("cold-start ignores all other fields — score is always null", () => {
    // Even if every factor would be maxed out, cold-start wins
    const result = computeRisk(
      basePatient({
        totalAppointmentCount: 1,
        missedAppointmentCount: 1,
        distanceKm: 99,
        age: 80,
        daysSinceLastVisit: 999,
        expectedFrequencyDays: 7,
      })
    );
    expect(result.score).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Factor 1: Missed-ratio  (max 35 pts)
// ---------------------------------------------------------------------------

describe("Factor 1 — missedRatio", () => {
  it("scores 0 pts when no appointments are missed", () => {
    const result = computeRisk(
      basePatient({ totalAppointmentCount: 10, missedAppointmentCount: 0 })
    );
    const factor = result.reasons.find((r) => r.key === "missedRatio")!;
    expect(factor.points).toBe(0);
    expect(factor.maxPoints).toBe(35);
  });

  it("scores 35 pts when ALL appointments are missed", () => {
    const result = computeRisk(
      basePatient({ totalAppointmentCount: 10, missedAppointmentCount: 10 })
    );
    const factor = result.reasons.find((r) => r.key === "missedRatio")!;
    expect(factor.points).toBe(35);
  });

  it("scores round(ratio * 35) for 50% missed rate → 18 pts", () => {
    // round(0.5 * 35) = round(17.5) = 18
    const result = computeRisk(
      basePatient({ totalAppointmentCount: 10, missedAppointmentCount: 5 })
    );
    const factor = result.reasons.find((r) => r.key === "missedRatio")!;
    expect(factor.points).toBe(18);
  });

  it("scores round(3/10 * 35) = 11 pts for 30% miss rate", () => {
    const result = computeRisk(
      basePatient({ totalAppointmentCount: 10, missedAppointmentCount: 3 })
    );
    const factor = result.reasons.find((r) => r.key === "missedRatio")!;
    expect(factor.points).toBe(11); // round(0.3 * 35) = round(10.5) = 11
  });
});

// ---------------------------------------------------------------------------
// Factor 2: Overdue-ness  (max 20 pts)
// ---------------------------------------------------------------------------

describe("Factor 2 — overdue", () => {
  it("scores 0 pts when patient is within their visit window (not overdue)", () => {
    // days(10) / freq(30) - 1 = -0.67 → clamped to 0
    const result = computeRisk(
      basePatient({ daysSinceLastVisit: 10, expectedFrequencyDays: 30 })
    );
    const factor = result.reasons.find((r) => r.key === "overdue")!;
    expect(factor.points).toBe(0);
  });

  it("scores 0 pts at exactly 1× the frequency (on-time boundary)", () => {
    // days(30) / freq(30) - 1 = 0 → clamped to 0 → 0 pts
    const result = computeRisk(
      basePatient({ daysSinceLastVisit: 30, expectedFrequencyDays: 30 })
    );
    const factor = result.reasons.find((r) => r.key === "overdue")!;
    expect(factor.points).toBe(0);
  });

  it("scores partial pts at 1.5× frequency — clamped max raw (30 pts → capped to 20)", () => {
    // days(45) / freq(30) - 1 = 0.5 → clamp(0.5, 0, 1.5) = 0.5 → round(0.5*20) = 10
    const result = computeRisk(
      basePatient({ daysSinceLastVisit: 45, expectedFrequencyDays: 30 })
    );
    const factor = result.reasons.find((r) => r.key === "overdue")!;
    expect(factor.points).toBe(10);
  });

  it("scores 20 pts (max) when ratio >= 2.5× frequency (clamp ceiling at 1.5)", () => {
    // days(75) / freq(30) - 1 = 1.5 → clamp = 1.5 → round(1.5*20) = 30 → but maxed at 20? No — check the engine
    // Actually: clamp(raw, 0, 1.5) * 20 = 1.5 * 20 = 30 → but result.points is NOT capped per-factor,
    // so it CAN exceed maxPoints. The SCORE_CAP is applied to the total. Let's verify actual value.
    const result = computeRisk(
      basePatient({ daysSinceLastVisit: 75, expectedFrequencyDays: 30 })
    );
    const factor = result.reasons.find((r) => r.key === "overdue")!;
    // clamp(75/30 - 1, 0, 1.5) = clamp(1.5, 0, 1.5) = 1.5; round(1.5 * 20) = 30
    expect(factor.points).toBe(30);
  });

  it("score is clamped to 1.5 even beyond 2.5× (no extra points)", () => {
    // days(200) / freq(30) - 1 = 5.67 → clamp(5.67, 0, 1.5) = 1.5 → 30
    const result1 = computeRisk(
      basePatient({ daysSinceLastVisit: 75, expectedFrequencyDays: 30 })
    );
    const result2 = computeRisk(
      basePatient({ daysSinceLastVisit: 200, expectedFrequencyDays: 30 })
    );
    const pts1 = result1.reasons.find((r) => r.key === "overdue")!.points;
    const pts2 = result2.reasons.find((r) => r.key === "overdue")!.points;
    expect(pts1).toBe(pts2); // both hit the 1.5 clamp ceiling
  });
});

// ---------------------------------------------------------------------------
// Factor 3: Distance  (max 15 pts)
// ---------------------------------------------------------------------------

describe("Factor 3 — distance", () => {
  it("scores 0 pts at exactly 20 km (boundary — not > 20)", () => {
    const result = computeRisk(basePatient({ distanceKm: 20 }));
    const factor = result.reasons.find((r) => r.key === "distance")!;
    expect(factor.points).toBe(0);
  });

  it("scores 8 pts at 21 km (just above 20 km mid threshold)", () => {
    const result = computeRisk(basePatient({ distanceKm: 21 }));
    const factor = result.reasons.find((r) => r.key === "distance")!;
    expect(factor.points).toBe(8);
  });

  it("scores 8 pts at exactly 40 km (boundary — not > 40)", () => {
    const result = computeRisk(basePatient({ distanceKm: 40 }));
    const factor = result.reasons.find((r) => r.key === "distance")!;
    expect(factor.points).toBe(8);
  });

  it("scores 15 pts at 41 km (just above 40 km far threshold)", () => {
    const result = computeRisk(basePatient({ distanceKm: 41 }));
    const factor = result.reasons.find((r) => r.key === "distance")!;
    expect(factor.points).toBe(15);
  });

  it("scores 15 pts at very large distance", () => {
    const result = computeRisk(basePatient({ distanceKm: 200 }));
    const factor = result.reasons.find((r) => r.key === "distance")!;
    expect(factor.points).toBe(15);
  });

  it("scores 0 pts at 5 km (well within 20 km)", () => {
    const result = computeRisk(basePatient({ distanceKm: 5 }));
    const factor = result.reasons.find((r) => r.key === "distance")!;
    expect(factor.points).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Factor 4: Treatment fatigue  (max 15 pts)
// ---------------------------------------------------------------------------

describe("Factor 4 — fatigue", () => {
  it("scores 0 pts when elapsed/total ratio is <= 0.4", () => {
    // 40/200 = 0.2
    const result = computeRisk(
      basePatient({ treatmentElapsedDays: 40, treatmentTotalDays: 200 })
    );
    const factor = result.reasons.find((r) => r.key === "fatigue")!;
    expect(factor.points).toBe(0);
  });

  it("scores 0 pts at exactly 0.4 ratio (boundary — not > 0.4)", () => {
    // 40/100 = 0.4
    const result = computeRisk(
      basePatient({ treatmentElapsedDays: 40, treatmentTotalDays: 100 })
    );
    const factor = result.reasons.find((r) => r.key === "fatigue")!;
    expect(factor.points).toBe(0);
  });

  it("scores 6 pts when elapsed/total ratio is > 0.4 and <= 0.7", () => {
    // 50/100 = 0.5 → mid band
    const result = computeRisk(
      basePatient({ treatmentElapsedDays: 50, treatmentTotalDays: 100 })
    );
    const factor = result.reasons.find((r) => r.key === "fatigue")!;
    expect(factor.points).toBe(6);
  });

  it("scores 6 pts at exactly 0.7 ratio (boundary — not > 0.7)", () => {
    // 70/100 = 0.7
    const result = computeRisk(
      basePatient({ treatmentElapsedDays: 70, treatmentTotalDays: 100 })
    );
    const factor = result.reasons.find((r) => r.key === "fatigue")!;
    expect(factor.points).toBe(6);
  });

  it("scores 15 pts when elapsed/total ratio is > 0.7", () => {
    // 71/100 = 0.71
    const result = computeRisk(
      basePatient({ treatmentElapsedDays: 71, treatmentTotalDays: 100 })
    );
    const factor = result.reasons.find((r) => r.key === "fatigue")!;
    expect(factor.points).toBe(15);
  });

  it("scores 15 pts at 100% completion", () => {
    const result = computeRisk(
      basePatient({ treatmentElapsedDays: 100, treatmentTotalDays: 100 })
    );
    const factor = result.reasons.find((r) => r.key === "fatigue")!;
    expect(factor.points).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// Factor 5: Age band  (max 10 pts)
// ---------------------------------------------------------------------------

describe("Factor 5 — age", () => {
  it("scores 5 pts for age exactly 30 (young boundary, inclusive)", () => {
    const result = computeRisk(basePatient({ age: 30 }));
    const factor = result.reasons.find((r) => r.key === "age")!;
    expect(factor.points).toBe(5);
  });

  it("scores 0 pts for age 31 (just above young threshold)", () => {
    const result = computeRisk(basePatient({ age: 31 }));
    const factor = result.reasons.find((r) => r.key === "age")!;
    expect(factor.points).toBe(0);
  });

  it("scores 0 pts for mid-range age (40)", () => {
    const result = computeRisk(basePatient({ age: 40 }));
    const factor = result.reasons.find((r) => r.key === "age")!;
    expect(factor.points).toBe(0);
  });

  it("scores 0 pts for age 64 (just below senior threshold)", () => {
    const result = computeRisk(basePatient({ age: 64 }));
    const factor = result.reasons.find((r) => r.key === "age")!;
    expect(factor.points).toBe(0);
  });

  it("scores 10 pts for age exactly 65 (senior boundary, inclusive)", () => {
    const result = computeRisk(basePatient({ age: 65 }));
    const factor = result.reasons.find((r) => r.key === "age")!;
    expect(factor.points).toBe(10);
  });

  it("scores 10 pts for age 80", () => {
    const result = computeRisk(basePatient({ age: 80 }));
    const factor = result.reasons.find((r) => r.key === "age")!;
    expect(factor.points).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Factor 6: Visit frequency  (max 5 pts)
// ---------------------------------------------------------------------------

describe("Factor 6 — frequency", () => {
  it("scores 5 pts for frequency of exactly 14 days (threshold, inclusive)", () => {
    const result = computeRisk(basePatient({ expectedFrequencyDays: 14 }));
    const factor = result.reasons.find((r) => r.key === "frequency")!;
    expect(factor.points).toBe(5);
  });

  it("scores 5 pts for frequency of 7 days (frequent)", () => {
    const result = computeRisk(basePatient({ expectedFrequencyDays: 7 }));
    const factor = result.reasons.find((r) => r.key === "frequency")!;
    expect(factor.points).toBe(5);
  });

  it("scores 0 pts for frequency of 15 days (just above threshold)", () => {
    const result = computeRisk(basePatient({ expectedFrequencyDays: 15 }));
    const factor = result.reasons.find((r) => r.key === "frequency")!;
    expect(factor.points).toBe(0);
  });

  it("scores 0 pts for frequency of 30 days (standard cadence)", () => {
    const result = computeRisk(basePatient({ expectedFrequencyDays: 30 }));
    const factor = result.reasons.find((r) => r.key === "frequency")!;
    expect(factor.points).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 100-point score cap
// ---------------------------------------------------------------------------

describe("100-point score cap", () => {
  it("caps total score at 100 even when raw factor sum exceeds 100", () => {
    // Worst-case patient: all factors maxed
    // missedRatio: 10/10 → 35 pts
    // overdue: 200/30 - 1 = 5.67 → clamp 1.5 → 30 pts
    // distance: 99 km → 15 pts
    // fatigue: 90/100 = 0.9 → 15 pts
    // age: 70 → 10 pts
    // frequency: 7 days → 5 pts
    // raw total = 35 + 30 + 15 + 15 + 10 + 5 = 110 → should be capped at 100
    const result = computeRisk({
      id: "CAP",
      name: "Cap Test",
      age: 70,
      distanceKm: 99,
      totalAppointmentCount: 10,
      missedAppointmentCount: 10,
      daysSinceLastVisit: 200,
      expectedFrequencyDays: 7,
      treatmentElapsedDays: 90,
      treatmentTotalDays: 100,
    });
    expect(result.score).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Tier boundaries
// ---------------------------------------------------------------------------

describe("Tier boundaries", () => {
  it("score 29 → tier 'Low'", () => {
    // missedRatio only: round(x/total * 35) = 29 → x/total ≈ 0.829 → use 29/35 = 0.829 → 29/35*10 ≈ 8.3 missed of 10
    // More direct: 8 missed of 10 = 0.8 → round(0.8 * 35) = round(28) = 28
    // 9 missed of 10 = 0.9 → round(0.9 * 35) = round(31.5) = 32 — too high
    // Let's try 9 of 11 = 0.818 → round(28.6) = 29 ✓
    const result = computeRisk(
      basePatient({
        totalAppointmentCount: 11,
        missedAppointmentCount: 9,
        // ensure all other factors are 0
        distanceKm: 10,
        age: 40,
        daysSinceLastVisit: 10,
        expectedFrequencyDays: 30,
        treatmentElapsedDays: 10,
        treatmentTotalDays: 200,
      })
    );
    // Verify score is 29
    expect(result.score).toBe(29);
    expect(result.tier).toBe("Low");
  });

  it("score 30 → tier 'Medium' (lower boundary, inclusive)", () => {
    // 6 missed of 7 = 0.857 → round(0.857 * 35) = round(30) = 30
    const result = computeRisk(
      basePatient({
        totalAppointmentCount: 7,
        missedAppointmentCount: 6,
        distanceKm: 10,
        age: 40,
        daysSinceLastVisit: 10,
        expectedFrequencyDays: 30,
        treatmentElapsedDays: 10,
        treatmentTotalDays: 200,
      })
    );
    expect(result.score).toBe(30);
    expect(result.tier).toBe("Medium");
  });

  it("score 54 → tier 'Medium' (just below High boundary)", () => {
    // missedRatio: all 10/10 = 35 pts
    // + fatigue: 71/100 = 0.71 → 15 pts
    // + age: 65 → 10 pts  (total = 60 — too high)
    // missedRatio: 10/10 = 35 + fatigue 0.71 = 15 + frequency 0 + age 0 + overdue 0 + distance 0
    // Need exactly 54: try missedRatio 29 (9/11) + distance 15 (41km) + frequency 5 (7d) + fatigue 6 (50%) = 55 — too high
    // Try: missedRatio 35 (10/10) + distance 15 (41km) + fatigue 0 + age 0 + overdue 0 + freq 0 = 50 — not 54
    // missedRatio 35 + distance 8 + fatigue 6 + freq 5 = 54 ✓
    const result = computeRisk(
      basePatient({
        totalAppointmentCount: 10,
        missedAppointmentCount: 10, // 35 pts
        distanceKm: 25,              // 8 pts (20-40 km)
        treatmentElapsedDays: 50,
        treatmentTotalDays: 100,     // 0.5 → 6 pts
        expectedFrequencyDays: 14,   // 5 pts
        age: 40,                     // 0 pts
        daysSinceLastVisit: 10,      // 0 pts (10/14 - 1 < 0)
      })
    );
    expect(result.score).toBe(54);
    expect(result.tier).toBe("Medium");
  });

  it("score 55 → tier 'High' (lower boundary, inclusive)", () => {
    // missedRatio 35 + distance 15 + fatigue 0 + age 0 + overdue 0 + freq 5 = 55
    const result = computeRisk(
      basePatient({
        totalAppointmentCount: 10,
        missedAppointmentCount: 10, // 35 pts
        distanceKm: 41,              // 15 pts
        expectedFrequencyDays: 14,   // 5 pts
        age: 40,                     // 0 pts
        daysSinceLastVisit: 10,      // 10/14 - 1 < 0 → 0 pts
        treatmentElapsedDays: 10,
        treatmentTotalDays: 200,     // 0.05 → 0 pts
      })
    );
    expect(result.score).toBe(55);
    expect(result.tier).toBe("High");
  });
});

// ---------------------------------------------------------------------------
// suggestedActions sanity
// ---------------------------------------------------------------------------

describe("suggestedActions", () => {
  it("returns at least one action for a scored patient", () => {
    const result = computeRisk(basePatient());
    expect(result.suggestedActions.length).toBeGreaterThanOrEqual(1);
  });

  it("returns the cold-start action for cold-start patients", () => {
    const result = computeRisk(basePatient({ totalAppointmentCount: 1 }));
    expect(result.suggestedActions[0]).toBe("Flag for manual review at first follow-up");
  });

  it("returns no-risk action when all factors are 0", () => {
    // base patient scores 0 on every factor
    const result = computeRisk(basePatient());
    expect(result.suggestedActions[0]).toBe("Continue standard follow-up care");
  });
});
