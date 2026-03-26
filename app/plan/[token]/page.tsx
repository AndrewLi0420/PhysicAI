"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Plan, RecoveryPlan, PlanExercise } from "@/types";


// ─── Exercise name lookup ──────────────────────────────────────────────────────

function formatExercise(ex: PlanExercise): string {
  const parts: string[] = [];
  if (ex.sets && ex.reps) parts.push(`${ex.sets}×${ex.reps}`);
  else if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.duration_sec) parts.push(`${ex.duration_sec}s`);
  return parts.join(", ");
}

function exerciseLabel(id: string): string {
  return id
    .split("-")
    .slice(1)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── Components ───────────────────────────────────────────────────────────────

function PendingReviewScreen() {
  const router = useRouter();
  return (
    <main className="flex flex-col min-h-svh px-8 bg-background max-w-xl mx-auto w-full">
      <div className="flex flex-col gap-6 pt-24 pb-10">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground mb-2">Plan under review</h1>
          <p className="text-sm text-ds-text-2 leading-relaxed">
            A physical therapist is reviewing your recovery plan. You&apos;ll receive an email when it&apos;s ready — usually within a few hours.
          </p>
        </div>
        <div className="bg-ds-accent-lt border border-ds-accent/20 rounded-xl px-5 py-4">
          <p className="text-xs text-ds-accent-dk leading-relaxed font-medium">
            While you wait: rest, ice 20 min on/off, and elevate if possible.
          </p>
        </div>
        <button
          onClick={() => router.replace("/")}
          className="text-sm text-ds-text-3 hover:text-ds-text-2 underline underline-offset-2 transition-colors text-left"
        >
          ← Start a new assessment
        </button>
      </div>
    </main>
  );
}

function ExerciseCard({ ex }: { ex: PlanExercise }) {
  const label = exerciseLabel(ex.exercise_id);
  const detail = formatExercise(ex);
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center gap-4">
      <span className="font-data text-xl font-semibold text-ds-accent tabular-nums min-w-[20px]">
        {detail.split("×")[0]}
      </span>
      <div>
        <p className="font-semibold text-foreground text-sm">{label}</p>
        {detail && <p className="text-xs text-ds-text-3 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function PlanScreen({ plan }: { plan: RecoveryPlan & { currentDay: number } }) {
  const phase = plan.phases?.[0];

  return (
    <main className="flex flex-col min-h-svh bg-background max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-ds-accent">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">PhysicAI</p>
        <h1 className="font-heading text-2xl font-bold text-white mb-1">{plan.injury_subtype}</h1>
        <p className="text-sm text-white/75">{plan.severity} · {plan.timeline_days[0]}–{plan.timeline_days[1]} days recovery</p>
      </div>

      <div className="flex flex-col gap-6 px-5 py-6">
        {/* Current phase */}
        {phase && (
          <section>
            <p className="text-xs font-bold text-ds-text-3 uppercase tracking-widest mb-2">{phase.label}</p>
            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="font-semibold text-foreground text-sm mb-1">{phase.name}</p>
              <p className="text-sm text-ds-text-2 leading-relaxed">{phase.description}</p>
            </div>
          </section>
        )}

        {/* Today's exercises */}
        <section>
          <p className="text-xs font-bold text-ds-text-3 uppercase tracking-widest mb-3">
            Day {plan.currentDay} Exercises
          </p>
          <div className="flex flex-col gap-2">
            {plan.todays_exercises.map((ex) => (
              <ExerciseCard key={ex.exercise_id} ex={ex} />
            ))}
          </div>
        </section>

        {/* Red flags */}
        {plan.red_flags?.length > 0 && (
          <section>
            <p className="text-xs font-bold text-ds-text-3 uppercase tracking-widest mb-2">Watch for</p>
            <div className="rounded-xl bg-ds-error-lt border border-ds-error/20 px-5 py-4">
              <ul className="flex flex-col gap-1.5">
                {plan.red_flags.map((flag, i) => (
                  <li key={i} className="text-sm text-ds-error flex gap-2">
                    <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-ds-error" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-ds-text-3 text-center leading-relaxed">
          Recovery guidance only — not a substitute for medical advice. See a doctor if symptoms worsen.
        </p>
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`/api/plan?token=${token}`);
        if (res.status === 404) {
          setError("Plan not found.");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const row: Plan = await res.json();
        setPlan(row);
      } catch (err) {
        console.error(err);
        setError("Failed to load plan.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background max-w-xl mx-auto w-full">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-ds-accent-lt" />
          <div className="absolute inset-0 rounded-full border-4 border-ds-accent border-t-transparent animate-spin" />
        </div>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="flex flex-col min-h-svh items-center justify-center px-8 gap-4 bg-background max-w-xl mx-auto w-full">
        <p className="text-base text-red-600 font-semibold">{error ?? "Something went wrong."}</p>
        <button
          onClick={() => router.replace("/")}
          className="px-6 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm"
        >
          Start over
        </button>
      </main>
    );
  }

  if (plan.status === "pending_review" || plan.status === "generation_failed") {
    return <PendingReviewScreen />;
  }

  if (!plan.plan_json) {
    return <PendingReviewScreen />;
  }

  return <PlanScreen plan={{ ...plan.plan_json, currentDay: plan.current_day }} />;
}
