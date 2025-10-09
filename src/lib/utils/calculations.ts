import type { SetEntry, SessionSummary, WorkoutSession } from "@/lib/types";

export function calculateOneRepMax(
  weight: number,
  reps: number,
  formula: "epley" | "brzycki" = "epley",
): number {
  if (reps === 1) return weight;

  switch (formula) {
    case "epley":
      return weight * (1 + reps / 30);
    case "brzycki":
      return (weight * 36) / (37 - reps);
    default:
      return weight * (1 + reps / 30);
  }
}

export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function calculateSetVolume(set: SetEntry): number {
  if (set.weight && set.reps && !set.isWarmup) {
    return calculateVolume(set.weight, set.reps);
  }
  return 0;
}

export function calculateSessionSummary(
  session: WorkoutSession,
): SessionSummary {
  let totalSets = 0;
  let totalReps = 0;
  let totalWeight = 0;
  let totalVolume = 0;

  session.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      if (!set.isWarmup) {
        totalSets++;
        if (set.reps) totalReps += set.reps;
        if (set.weight) totalWeight += set.weight;
        totalVolume += calculateSetVolume(set);
      }
    });
  });

  const duration =
    session.startedAt && session.endedAt
      ? Math.round(
          (session.endedAt.getTime() - session.startedAt.getTime()) /
            (1000 * 60),
        )
      : 0;

  return {
    totalSets,
    totalReps,
    totalWeight,
    totalVolume,
    duration,
    exerciseCount: session.exercises.length,
  };
}

export function formatWeight(
  weight: number,
  unit: "metric" | "imperial",
): string {
  const suffix = unit === "metric" ? "kg" : "lbs";
  return `${weight} ${suffix}`;
}

export function formatHeight(
  height: number,
  unit: "metric" | "imperial",
): string {
  const suffix = unit === "metric" ? "cm" : "in";
  return `${height} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function convertWeight(
  weight: number,
  from: "metric" | "imperial",
  to: "metric" | "imperial",
): number {
  if (from === to) return weight;

  if (from === "metric" && to === "imperial") {
    return Math.round(weight * 2.20462 * 100) / 100; // kg to lbs
  }

  if (from === "imperial" && to === "metric") {
    return Math.round(weight * 0.453592 * 100) / 100; // lbs to kg
  }

  return weight;
}
