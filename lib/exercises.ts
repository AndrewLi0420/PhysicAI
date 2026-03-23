import exercisesData from "@/exercises.json";
import type { Exercise, InjuryType, Phase } from "@/types";

const exercises = exercisesData.exercises as Exercise[];

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.exercise_id === id);
}

export function getExercisesForInjury(injuryType: InjuryType): Exercise[] {
  return exercises.filter((e) => e.injury_types.includes(injuryType));
}

export function getExercisesForPhase(
  injuryType: InjuryType,
  phase: Phase
): Exercise[] {
  return exercises.filter(
    (e) => e.injury_types.includes(injuryType) && e.phase === phase
  );
}

export function validateExerciseIds(ids: string[]): {
  valid: string[];
  invalid: string[];
} {
  const knownIds = new Set(exercises.map((e) => e.exercise_id));
  const valid = ids.filter((id) => knownIds.has(id));
  const invalid = ids.filter((id) => !knownIds.has(id));
  return { valid, invalid };
}

export function getAllExerciseIds(): string[] {
  return exercises.map((e) => e.exercise_id);
}
