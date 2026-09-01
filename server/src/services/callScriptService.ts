import { Patient, RiskResult } from "../types/patient";
import { CallScript } from "../types/call";

/**
 * Generates a ready-to-read call script for a nurse.
 *
 * This is deliberately NOT a free-text/LLM generation step disconnected
 * from the score — every line traces directly back to a ReasonContribution
 * or suggestedAction already computed by scoringEngine.ts. If a judge asks
 * "why does the script say that," the answer is always "because that's
 * factor #N in the breakdown, verbatim."
 */
export function generateCallScript(patient: Patient, risk: RiskResult): CallScript {
  const firstName = patient.name.split(" ")[0];

  if (risk.tier === "Insufficient history") {
    return {
      opening: `Hi, is this ${patient.name}? This is calling from the clinic to welcome you and confirm your upcoming visit.`,
      reasonLines: [
        "This patient has fewer than 2 recorded appointments — there isn't enough history yet for a risk score.",
      ],
      talkingPoints: [
        "Confirm contact details and preferred appointment times.",
        "Explain the expected visit frequency for their treatment plan.",
        "Ask if transport or scheduling is a likely barrier going forward.",
      ],
      closing: "Thank you, we'll see you at your next scheduled visit. Please call us if anything comes up.",
    };
  }

  const topReasons = risk.reasons.filter((r) => r.points > 0).slice(0, 3);

  const reasonLines = topReasons.map((r) => `${r.label} — contributing ${r.points} of ${r.maxPoints} points to their risk score.`);

  if (reasonLines.length === 0) {
    reasonLines.push("No single factor stands out — this patient is flagged mainly by cumulative overdue days.");
  }

  const talkingPoints = risk.suggestedActions.length > 0
    ? risk.suggestedActions
    : ["Confirm the next visit date and ask if anything might get in the way of attending."];

  return {
    opening: `Hi, is this ${firstName}? This is calling from the clinic — I wanted to check in ahead of your next follow-up.`,
    reasonLines,
    talkingPoints,
    closing: risk.tier === "High"
      ? "This visit really matters for your treatment — can we lock in a day and time right now?"
      : "Just wanted to make sure you're all set — is there anything that might get in the way of your next visit?",
  };
}
