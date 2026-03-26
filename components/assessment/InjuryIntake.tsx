"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BodyMap from "@/components/assessment/BodyMap";
import type { InjuryType } from "@/types";

// ─── Injury type display config ───────────────────────────────────────────────

const INJURY_TYPES: { type: InjuryType; label: string; region: string }[] = [
  { type: "ankle_sprain",       label: "Ankle",       region: "Lower leg" },
  { type: "knee_sprain",        label: "Knee",         region: "Lower leg" },
  { type: "shin_splints",       label: "Shin",         region: "Lower leg" },
  { type: "hamstring_strain",   label: "Hamstring",    region: "Upper leg" },
  { type: "groin_strain",       label: "Groin",        region: "Upper leg" },
  { type: "lower_back_strain",  label: "Lower Back",   region: "Torso"     },
  { type: "shoulder_sprain",    label: "Shoulder",     region: "Upper body" },
  { type: "wrist_sprain",       label: "Wrist",        region: "Upper body" },
  { type: "finger_sprain",      label: "Finger",       region: "Upper body" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function InjuryIntake() {
  const router = useRouter();
  const [selected, setSelected] = useState<InjuryType | null>(null);

  function handleSelect(type: InjuryType) {
    setSelected((prev) => (prev === type ? null : type));
  }

  function handleStart() {
    if (!selected) return;
    router.push(`/assessment/${selected}`);
  }

  return (
    <main className="flex flex-col min-h-svh bg-white max-w-sm mx-auto w-full">

      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-1">
          PhysicAI
        </p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Where's the injury?
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tap your body or choose below
        </p>
      </div>

      {/* Body map + chip grid */}
      <div className="flex flex-1 gap-4 px-6 py-2 overflow-hidden">

        {/* Body map — left column */}
        <div className="w-[100px] shrink-0 flex items-start pt-2">
          <BodyMap selected={selected} onSelect={handleSelect} />
        </div>

        {/* Chip grid — right column */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto py-2">
          {INJURY_TYPES.map(({ type, label, region }) => {
            const isSelected = selected === type;
            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                aria-pressed={isSelected}
                className={[
                  "w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98]",
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200",
                ].join(" ")}
              >
                <span className={[
                  "block text-sm font-semibold leading-tight",
                  isSelected ? "text-blue-700" : "text-gray-800",
                ].join(" ")}>
                  {label}
                </span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  {region}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA — sticky footer */}
      <div className="px-6 pb-10 pt-4 border-t border-gray-100">
        <Button
          onClick={handleStart}
          disabled={!selected}
          className="w-full h-14 text-base font-semibold rounded-2xl disabled:opacity-40"
        >
          {selected
            ? `Start ${INJURY_TYPES.find((i) => i.type === selected)?.label} Assessment →`
            : "Select an injury to continue"}
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-center text-gray-400 mt-3 leading-relaxed">
          Recovery guidance only — not a substitute for medical advice.
          <br />
          Seek care immediately for severe pain or deformity.
        </p>
      </div>
    </main>
  );
}
