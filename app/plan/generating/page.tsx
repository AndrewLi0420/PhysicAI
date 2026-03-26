"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const STEPS = [
  "Analyzing your injury…",
  "Reviewing assessment results…",
  "Building your recovery phases…",
  "Selecting your exercises…",
  "Finalizing your plan…",
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const injuryParam = searchParams.get("injury");
  const injuryLabel = injuryParam
    ? injuryParam.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  // Cycle through loading copy every 1.8s
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Call Edge Function once on mount
  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    const raw = sessionStorage.getItem(`plan_flags_${token}`);
    if (!raw) {
      setError("Assessment data not found. Please start over.");
      return;
    }

    let collected_flags: Record<string, unknown>;
    try {
      collected_flags = JSON.parse(raw);
    } catch {
      setError("Assessment data corrupted. Please start over.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, collected_flags }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.retry) {
            // Server-side generation failed — show retry prompt
            setError("Plan generation failed. Please try again.");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        sessionStorage.removeItem(`plan_flags_${token}`);
        router.replace(`/plan/${token}`);
      } catch (err) {
        console.error("generate-plan error:", err);
        setError("Something went wrong. Please try again.");
      }
    })();
  }, [token, router]);

  if (error) {
    return (
      <main className="flex flex-col min-h-svh items-center justify-center px-8 gap-6 bg-background max-w-xl mx-auto w-full">
        <p className="text-base text-red-600 font-semibold text-center">{error}</p>
        <button
          onClick={() => router.replace("/")}
          className="px-6 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm"
        >
          Start over
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-svh items-center justify-center px-8 gap-8 bg-background max-w-xl mx-auto w-full">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-ds-accent-lt" />
        <div className="absolute inset-0 rounded-full border-4 border-ds-accent border-t-transparent animate-spin" />
      </div>

      {/* Loading copy */}
      <div className="text-center">
        <p
          key={stepIndex}
          className="animate-in fade-in duration-500 text-base font-semibold text-foreground"
        >
          {STEPS[stepIndex]}
        </p>
        {injuryLabel && (
          <p className="text-xs text-ds-text-3 mt-1">{injuryLabel}</p>
        )}
        <p className="text-sm text-ds-text-3 mt-2">
          This usually takes about 5 seconds
        </p>
      </div>
    </main>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense>
      <GeneratingContent />
    </Suspense>
  );
}
