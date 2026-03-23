"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { computeCheckInOutcome } from "@/lib/checkin";
import type { CheckInOutcome } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

// ─── Step components ──────────────────────────────────────────────────────────

function PainScoreStep({
  value,
  onChange,
  onNext,
}: {
  value: number | null;
  onChange: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
          Step 1 of 3
        </p>
        <h2 className="text-2xl font-bold text-gray-900">How's your pain today?</h2>
        <p className="text-sm text-gray-500 mt-1">1 = no pain, 10 = worst imaginable</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          const color =
            n <= 3
              ? selected
                ? "bg-green-500 text-white border-green-500"
                : "border-green-200 text-green-700 hover:bg-green-50"
              : n <= 6
              ? selected
                ? "bg-yellow-400 text-white border-yellow-400"
                : "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
              : selected
              ? "bg-red-500 text-white border-red-500"
              : "border-red-200 text-red-700 hover:bg-red-50";

          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`aspect-square rounded-2xl border-2 font-bold text-lg transition-all ${color}`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={value === null}
        className="w-full py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Next
      </button>
    </div>
  );
}

function YesNoStep({
  step,
  total,
  question,
  value,
  onChange,
  onNext,
  onBack,
}: {
  step: number;
  total: number;
  question: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
          Step {step} of {total}
        </p>
        <h2 className="text-2xl font-bold text-gray-900">{question}</h2>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map(({ label, val }) => {
          const selected = value === val;
          return (
            <button
              key={label}
              onClick={() => onChange(val)}
              className={`w-full py-5 rounded-2xl border-2 font-semibold text-lg transition-all ${
                selected
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-base"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={value === null}
          className="flex-[2] py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SubmitStep({
  painScore,
  swelling,
  weightBearing,
  onBack,
  onSubmit,
  submitting,
}: {
  painScore: number;
  swelling: boolean;
  weightBearing: boolean;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">
          Review
        </p>
        <h2 className="text-2xl font-bold text-gray-900">Looks good?</h2>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Pain score</span>
          <span className="font-bold text-gray-900">{painScore} / 10</span>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Swelling</span>
          <span className="font-bold text-gray-900">{swelling ? "Yes" : "No"}</span>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Weight bearing</span>
          <span className="font-bold text-gray-900">{weightBearing ? "Yes" : "No"}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-base disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-[2] py-4 rounded-2xl bg-blue-500 text-white font-semibold text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving…
            </>
          ) : (
            "Submit check-in"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Outcome screen ───────────────────────────────────────────────────────────

const outcomeConfig = {
  advance: {
    bg: "bg-green-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    badge: "Advancing",
    heading: "Great progress!",
    body: "Moving to next phase",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  hold: {
    bg: "bg-yellow-50",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    badge: "Hold steady",
    heading: "Stay at today's level",
    body: "You've got this — keep going at the same pace",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  escalate: {
    bg: "bg-red-50",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    badge: "Rest today",
    heading: "Pain is high",
    body: "Rest today and consider seeing a doctor",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
};

function OutcomeScreen({ outcome }: { outcome: CheckInOutcome }) {
  const cfg = outcomeConfig[outcome];
  return (
    <div className={`flex flex-col gap-6 rounded-3xl px-6 py-8 ${cfg.bg}`}>
      <div className={`w-14 h-14 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}>
        {cfg.icon}
      </div>
      <div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText} mb-3`}>
          {cfg.badge}
        </span>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{cfg.heading}</h2>
        <p className="text-base text-gray-600">{cfg.body}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Step = "pain" | "swelling" | "weight_bearing" | "review" | "done";

export default function CheckInPage() {
  const { plan_id } = useParams<{ plan_id: string }>();

  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("pain");
  const [painScore, setPainScore] = useState<number | null>(null);
  const [swelling, setSwelling] = useState<boolean | null>(null);
  const [weightBearing, setWeightBearing] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null);

  // Fetch the plan to get current_day
  useEffect(() => {
    if (!plan_id) return;
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/plans?id=eq.${plan_id}&select=current_day`,
          { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: { current_day: number }[] = await res.json();
        if (!rows.length) throw new Error("Plan not found");
        setCurrentDay(rows[0].current_day);
      } catch (err) {
        console.error(err);
        setLoadError("Could not load plan.");
      }
    })();
  }, [plan_id]);

  async function handleSubmit() {
    if (painScore === null || swelling === null || weightBearing === null || currentDay === null) return;

    setSubmitting(true);
    setSubmitError(null);

    const result = computeCheckInOutcome({
      painScore,
      swellingWorsening: swelling,
      weightBearing,
    });

    try {
      // Insert check-in
      const ciRes = await fetch(`${SUPABASE_URL}/rest/v1/check_ins`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan_id,
          day: currentDay,
          pain_score: painScore,
          swelling,
          weight_bearing: weightBearing,
          outcome: result,
        }),
      });
      if (!ciRes.ok) {
        const text = await ciRes.text();
        throw new Error(`check_in insert failed: ${text}`);
      }

      // Update plan's current_day (only increment on advance)
      const newDay = result === "advance" ? currentDay + 1 : currentDay;
      const planRes = await fetch(
        `${SUPABASE_URL}/rest/v1/plans?id=eq.${plan_id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ current_day: newDay }),
        }
      );
      if (!planRes.ok) {
        const text = await planRes.text();
        throw new Error(`plan update failed: ${text}`);
      }

      setOutcome(result);
      setStep("done");
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (!currentDay && !loadError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-white">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex flex-col min-h-svh items-center justify-center px-8 gap-4 bg-white">
        <p className="text-base text-red-600 font-semibold">{loadError}</p>
      </main>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-col min-h-svh bg-white">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-gray-100">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-0.5">PhysicAI</p>
        <h1 className="text-lg font-bold text-gray-900">
          Day {currentDay} Check-in
        </h1>
      </div>

      <div className="flex-1 px-5 py-8">
        {step === "pain" && (
          <PainScoreStep
            value={painScore}
            onChange={setPainScore}
            onNext={() => setStep("swelling")}
          />
        )}

        {step === "swelling" && (
          <YesNoStep
            step={2}
            total={3}
            question="Any swelling?"
            value={swelling}
            onChange={setSwelling}
            onNext={() => setStep("weight_bearing")}
            onBack={() => setStep("pain")}
          />
        )}

        {step === "weight_bearing" && (
          <YesNoStep
            step={3}
            total={3}
            question="Can you bear weight on it?"
            value={weightBearing}
            onChange={setWeightBearing}
            onNext={() => setStep("review")}
            onBack={() => setStep("swelling")}
          />
        )}

        {step === "review" && painScore !== null && swelling !== null && weightBearing !== null && (
          <div className="flex flex-col gap-6">
            <SubmitStep
              painScore={painScore}
              swelling={swelling}
              weightBearing={weightBearing}
              onBack={() => setStep("weight_bearing")}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
            {submitError && (
              <p className="text-sm text-red-600 text-center">{submitError}</p>
            )}
          </div>
        )}

        {step === "done" && outcome && (
          <div className="flex flex-col gap-6">
            <OutcomeScreen outcome={outcome} />
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Recovery guidance only — not a substitute for medical advice.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
