// ─── Decision Tree ────────────────────────────────────────────────────────────

export type InjuryType =
  | "ankle_sprain"
  | "knee_sprain"
  | "hamstring_strain"
  | "groin_strain"
  | "shoulder_sprain"
  | "lower_back_strain"
  | "shin_splints"
  | "wrist_sprain"
  | "finger_sprain";

export interface TreeOption {
  label: string;
  next_node_id: string | null;
  set_flags: Record<string, unknown>;
}

export interface TreeNode {
  prompt?: string;
  options?: TreeOption[];
  terminal?: boolean;
  outcome?: TerminalOutcome;
}

export interface TerminalOutcome {
  seek_care: boolean;
  seek_care_reason?: string;
  grade: "I" | "II" | "III" | null;
  injury_subtype: string;
  timeline_days?: [number, number];
  monitor_note?: string;
}

export interface DecisionTree {
  injury_type: InjuryType;
  display_name: string;
  version: string;
  pt_reviewed: boolean;
  start: string;
  nodes: Record<string, TreeNode>;
}

export interface CollectedFlags {
  injury_type: InjuryType;
  [key: string]: unknown;
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export type Phase = "1_pain_control" | "2_rom_strength" | "3_return_to_sport";

export interface Exercise {
  exercise_id: string;
  name: string;
  description: string;
  sets: number | null;
  reps: number | null;
  duration_sec: number | null;
  phase: Phase;
  injury_types: InjuryType[];
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export type PlanStatus = "pending_review" | "approved" | "generation_failed";

export interface RecoveryPhase {
  label: string;
  name: string;
  description: string;
}

export interface PlanExercise {
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  duration_sec: number | null;
}

export interface RecoveryPlan {
  injury_type: string;
  injury_subtype: string;
  severity: "Grade I" | "Grade II" | "Grade III";
  timeline_days: [number, number];
  phases: RecoveryPhase[];
  todays_exercises: PlanExercise[];
  red_flags: string[];
  seek_care: boolean;
}

export interface Plan {
  id: string;
  token: string;
  user_id: string | null;
  status: PlanStatus;
  plan_json: RecoveryPlan | null;
  collected_flags: CollectedFlags;
  created_at: string;
  current_phase: number;
  current_day: number;
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export type CheckInOutcome = "advance" | "hold" | "escalate";

export interface CheckIn {
  id: string;
  plan_id: string;
  day: number;
  pain_score: number; // 1-10
  swelling: boolean;
  weight_bearing: boolean;
  outcome: CheckInOutcome;
  created_at: string;
}
