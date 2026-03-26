"use client";

import { useRouter } from "next/navigation";
import type { TerminalOutcome } from "@/types";

interface SeekCareScreenProps {
  outcome: TerminalOutcome;
}

export default function SeekCareScreen({ outcome }: SeekCareScreenProps) {
  const router = useRouter();

  return (
    <div className="animate-in fade-in duration-300 flex flex-col gap-6 py-4">

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-bold text-foreground leading-tight">
          Seek medical care
        </h2>
        <p className="text-sm font-semibold text-ds-error">
          {outcome.injury_subtype}
        </p>
      </div>

      {/* Reason */}
      {outcome.seek_care_reason && (
        <p className="text-base text-ds-text-2 leading-relaxed">
          {outcome.seek_care_reason}
        </p>
      )}

      {/* What to do */}
      <div className="bg-ds-error-lt border border-ds-error/20 rounded-xl p-4 flex flex-col gap-1">
        <p className="text-sm font-semibold text-ds-error mb-1">What to do now</p>
        <ul className="text-sm text-ds-text-2 leading-relaxed list-disc list-inside space-y-1">
          <li>Stop activity immediately</li>
          <li>Avoid putting weight on the injury if possible</li>
          <li>Contact a doctor, urgent care, or ER depending on severity</li>
          <li>Apply ice wrapped in cloth while you wait</li>
        </ul>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-ds-text-3 leading-relaxed">
        This assessment is for informational purposes only and is not a substitute for professional medical evaluation.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={() => router.push("/")}
          className="w-full py-4 rounded-xl bg-ds-error text-white font-semibold text-sm transition-opacity hover:opacity-90"
        >
          Assess a different injury
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-ds-text-3 text-center py-2 hover:text-ds-text-2 transition-colors"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
