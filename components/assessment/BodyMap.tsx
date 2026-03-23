"use client";

import type { InjuryType } from "@/types";

// ─── Zone config ──────────────────────────────────────────────────────────────
// viewBox: 0 0 180 420
// Body silhouette shapes are decorative (gray fill).
// Each zone is an SVG group with an invisible expanded hit area + visible indicator.
// Bilateral zones (knee, ankle, etc.) share one injury type.

interface BodyZone {
  injuryType: InjuryType;
  /** SVG elements for the visible indicator(s) when selected / hovered */
  indicators: Array<{ cx: number; cy: number; rx: number; ry: number }>;
  /** Expanded hit areas (invisible) for touch accuracy */
  hitAreas: Array<{ cx: number; cy: number; rx: number; ry: number }>;
}

const ZONES: BodyZone[] = [
  {
    injuryType: "shoulder_sprain",
    indicators: [
      { cx: 33, cy: 82, rx: 16, ry: 16 },
      { cx: 147, cy: 82, rx: 16, ry: 16 },
    ],
    hitAreas: [
      { cx: 33, cy: 82, rx: 26, ry: 26 },
      { cx: 147, cy: 82, rx: 26, ry: 26 },
    ],
  },
  {
    injuryType: "wrist_sprain",
    indicators: [
      { cx: 16, cy: 200, rx: 13, ry: 11 },
      { cx: 164, cy: 200, rx: 13, ry: 11 },
    ],
    hitAreas: [
      { cx: 16, cy: 200, rx: 22, ry: 20 },
      { cx: 164, cy: 200, rx: 22, ry: 20 },
    ],
  },
  {
    injuryType: "finger_sprain",
    indicators: [
      { cx: 13, cy: 226, rx: 11, ry: 10 },
      { cx: 167, cy: 226, rx: 11, ry: 10 },
    ],
    hitAreas: [
      { cx: 13, cy: 226, rx: 20, ry: 18 },
      { cx: 167, cy: 226, rx: 20, ry: 18 },
    ],
  },
  {
    injuryType: "lower_back_strain",
    indicators: [{ cx: 90, cy: 152, rx: 28, ry: 14 }],
    hitAreas: [{ cx: 90, cy: 152, rx: 36, ry: 22 }],
  },
  {
    injuryType: "groin_strain",
    indicators: [{ cx: 90, cy: 178, rx: 24, ry: 12 }],
    hitAreas: [{ cx: 90, cy: 178, rx: 34, ry: 20 }],
  },
  {
    injuryType: "hamstring_strain",
    indicators: [
      { cx: 67, cy: 210, rx: 18, ry: 18 },
      { cx: 113, cy: 210, rx: 18, ry: 18 },
    ],
    hitAreas: [
      { cx: 67, cy: 210, rx: 26, ry: 26 },
      { cx: 113, cy: 210, rx: 26, ry: 26 },
    ],
  },
  {
    injuryType: "knee_sprain",
    indicators: [
      { cx: 67, cy: 256, rx: 16, ry: 15 },
      { cx: 113, cy: 256, rx: 16, ry: 15 },
    ],
    hitAreas: [
      { cx: 67, cy: 256, rx: 24, ry: 22 },
      { cx: 113, cy: 256, rx: 24, ry: 22 },
    ],
  },
  {
    injuryType: "shin_splints",
    indicators: [
      { cx: 65, cy: 292, rx: 12, ry: 20 },
      { cx: 115, cy: 292, rx: 12, ry: 20 },
    ],
    hitAreas: [
      { cx: 65, cy: 292, rx: 22, ry: 28 },
      { cx: 115, cy: 292, rx: 22, ry: 28 },
    ],
  },
  {
    injuryType: "ankle_sprain",
    indicators: [
      { cx: 65, cy: 334, rx: 14, ry: 11 },
      { cx: 115, cy: 334, rx: 14, ry: 11 },
    ],
    hitAreas: [
      { cx: 65, cy: 334, rx: 22, ry: 20 },
      { cx: 115, cy: 334, rx: 22, ry: 20 },
    ],
  },
];

// ─── Body silhouette paths (decorative, non-interactive) ──────────────────────

function BodySilhouette() {
  return (
    <g fill="#CBD5E1" aria-hidden="true">
      {/* Head */}
      <circle cx="90" cy="30" r="24" />
      {/* Neck */}
      <rect x="81" y="50" width="18" height="20" rx="4" />
      {/* Torso */}
      <rect x="52" y="65" width="76" height="95" rx="10" />
      {/* Left upper arm */}
      <rect
        x="28" y="68" width="26" height="72" rx="10"
        transform="rotate(-10 41 104)"
      />
      {/* Right upper arm */}
      <rect
        x="126" y="68" width="26" height="72" rx="10"
        transform="rotate(10 139 104)"
      />
      {/* Left forearm */}
      <rect
        x="14" y="132" width="22" height="68" rx="9"
        transform="rotate(-14 25 166)"
      />
      {/* Right forearm */}
      <rect
        x="144" y="132" width="22" height="68" rx="9"
        transform="rotate(14 155 166)"
      />
      {/* Left hand */}
      <ellipse cx="15" cy="210" rx="12" ry="15" />
      {/* Right hand */}
      <ellipse cx="165" cy="210" rx="12" ry="15" />
      {/* Left fingers */}
      <ellipse cx="13" cy="230" rx="9" ry="10" />
      {/* Right fingers */}
      <ellipse cx="167" cy="230" rx="9" ry="10" />
      {/* Hips */}
      <rect x="52" y="156" width="76" height="38" rx="8" />
      {/* Left thigh */}
      <rect x="52" y="188" width="34" height="72" rx="10" />
      {/* Right thigh */}
      <rect x="94" y="188" width="34" height="72" rx="10" />
      {/* Left knee */}
      <ellipse cx="69" cy="263" rx="17" ry="16" />
      {/* Right knee */}
      <ellipse cx="111" cy="263" rx="17" ry="16" />
      {/* Left shin */}
      <rect x="59" y="276" width="20" height="62" rx="8" />
      {/* Right shin */}
      <rect x="101" y="276" width="20" height="62" rx="8" />
      {/* Left ankle */}
      <ellipse cx="69" cy="340" rx="14" ry="10" />
      {/* Right ankle */}
      <ellipse cx="111" cy="340" rx="14" ry="10" />
      {/* Left foot */}
      <ellipse cx="60" cy="352" rx="22" ry="9" />
      {/* Right foot */}
      <ellipse cx="120" cy="352" rx="22" ry="9" />
    </g>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BodyMapProps {
  selected: InjuryType | null;
  onSelect: (type: InjuryType) => void;
}

export default function BodyMap({ selected, onSelect }: BodyMapProps) {
  return (
    <svg
      viewBox="0 0 180 420"
      className="w-full max-w-[160px] mx-auto select-none"
      aria-label="Body map — tap a region to select injury area"
    >
      <BodySilhouette />

      {ZONES.map((zone) => {
        const isSelected = selected === zone.injuryType;

        return (
          <g
            key={zone.injuryType}
            role="button"
            aria-label={zone.injuryType.replace(/_/g, " ")}
            aria-pressed={isSelected}
            onClick={() => onSelect(zone.injuryType)}
            className="cursor-pointer"
          >
            {/* Invisible expanded hit areas */}
            {zone.hitAreas.map((h, i) => (
              <ellipse
                key={i}
                cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry}
                fill="transparent"
              />
            ))}

            {/* Visible indicators */}
            {zone.indicators.map((v, i) => (
              <ellipse
                key={i}
                cx={v.cx} cy={v.cy} rx={v.rx} ry={v.ry}
                fill={isSelected ? "#3B82F6" : "transparent"}
                fillOpacity={isSelected ? 0.35 : 0}
                stroke={isSelected ? "#2563EB" : "#94A3B8"}
                strokeWidth={isSelected ? 2 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.5}
                className="transition-all duration-150"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
