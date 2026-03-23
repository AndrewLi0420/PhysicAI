import { describe, it, expect } from "vitest";
import { computeCheckInOutcome } from "@/lib/checkin";

describe("computeCheckInOutcome", () => {
  it("escalates when pain score >= 7", () => {
    expect(computeCheckInOutcome({ painScore: 7, swellingWorsening: false, weightBearing: true })).toBe("escalate");
    expect(computeCheckInOutcome({ painScore: 10, swellingWorsening: false, weightBearing: true })).toBe("escalate");
  });

  it("holds when pain score is 4-6", () => {
    expect(computeCheckInOutcome({ painScore: 4, swellingWorsening: false, weightBearing: true })).toBe("hold");
    expect(computeCheckInOutcome({ painScore: 6, swellingWorsening: false, weightBearing: true })).toBe("hold");
  });

  it("advances when pain score <= 3 with no issues", () => {
    expect(computeCheckInOutcome({ painScore: 3, swellingWorsening: false, weightBearing: true })).toBe("advance");
    expect(computeCheckInOutcome({ painScore: 1, swellingWorsening: false, weightBearing: true })).toBe("advance");
  });

  it("escalates on swelling worsening regardless of pain score", () => {
    expect(computeCheckInOutcome({ painScore: 2, swellingWorsening: true, weightBearing: true })).toBe("escalate");
  });

  it("holds when weight bearing is false", () => {
    expect(computeCheckInOutcome({ painScore: 2, swellingWorsening: false, weightBearing: false })).toBe("hold");
  });
});
