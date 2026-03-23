import type { CheckInOutcome } from "@/types";

/**
 * Check-in decision logic — boundary-tested values per design spec.
 *
 *  pain ≤ 3 AND weight_bearing = true  → advance
 *  pain 4-6 OR weight_bearing = false   → hold
 *  pain ≥ 7 OR swelling worsening       → escalate
 *
 * Priority: escalate > hold > advance (highest risk wins)
 */
export function computeCheckInOutcome(params: {
  painScore: number;
  swellingWorsening: boolean;
  weightBearing: boolean;
}): CheckInOutcome {
  const { painScore, swellingWorsening, weightBearing } = params;

  if (painScore >= 7 || swellingWorsening) return "escalate";
  if (painScore <= 3 && weightBearing) return "advance";
  return "hold";
}
