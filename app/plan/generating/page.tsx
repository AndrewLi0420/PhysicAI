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

    const raw = sessionStorage.getItem(`assessment_${token}`);
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

        sessionStorage.removeItem(`assessment_${token}`);
        router.replace(`/plan/${token}`);
      } catch (err) {
        console.error("generate-plan error:", err);
        setError("Something went wrong. Please try again.");
      }
    })();
  }, [token, router]);

  if (error) {
    return (
      <main className="flex flex-col min-h-svh items-center justify-center px-8 gap-6 bg-white">
        <p className="text-base text-red-600 font-semibold text-center">{error}</p>
        <button
          onClick={() => router.replace("/")}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold text-sm"
        >
          Start over
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-svh items-center justify-center px-8 gap-8 bg-white">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>

      {/* Loading copy */}
      <div className="text-center">
        <p
          key={stepIndex}
          className="animate-in fade-in duration-500 text-base font-semibold text-gray-800"
        >
          {STEPS[stepIndex]}
        </p>
        <p className="text-sm text-gray-400 mt-2">
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
