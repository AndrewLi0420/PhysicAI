"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TerminalOutcome } from "@/types";

interface SeekCareScreenProps {
  outcome: TerminalOutcome;
}

export default function SeekCareScreen({ outcome }: SeekCareScreenProps) {
  const router = useRouter();

  return (
    <div className="animate-in fade-in duration-300 flex flex-col gap-6 py-4">

      {/* Icon */}
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl">
        🚨
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          Seek medical care
        </h2>
        <p className="text-sm font-medium text-red-600">
          {outcome.injury_subtype}
        </p>
      </div>

      {/* Reason */}
      {outcome.seek_care_reason && (
        <p className="text-base text-gray-700 leading-relaxed">
          {outcome.seek_care_reason}
        </p>
      )}

      {/* What to do */}
      <div className="bg-red-50 rounded-2xl p-4 flex flex-col gap-1">
        <p className="text-sm font-semibold text-red-800">What to do now</p>
        <ul className="text-sm text-red-700 leading-relaxed list-disc list-inside space-y-1">
          <li>Stop activity immediately</li>
          <li>Avoid putting weight on the injury if possible</li>
          <li>Contact a doctor, urgent care, or ER depending on severity</li>
          <li>Apply ice wrapped in cloth while you wait</li>
        </ul>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 leading-relaxed">
        This assessment is for informational purposes only and is not a substitute for professional medical evaluation.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          className="w-full h-13 rounded-2xl font-semibold text-sm bg-red-500 hover:bg-red-600"
          onClick={() => router.push("/")}
        >
          Assess a different injury
        </Button>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-400 text-center py-2"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
