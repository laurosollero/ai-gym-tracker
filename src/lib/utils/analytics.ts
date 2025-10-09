import type { WorkoutSession, PersonalRecord, ProgressData } from "@/lib/types";

export function generateVolumeProgressData(
  sessions: WorkoutSession[],
): ProgressData[] {
  return sessions
    .filter((session) => session.endedAt)
    .map((session) => {
      const totalVolume = session.exercises.reduce(
        (sum, exercise) =>
          sum +
          exercise.sets
            .filter(
              (set) =>
                set.completedAt && set.weight && set.reps && !set.isWarmup,
            )
            .reduce(
              (exerciseSum, set) => exerciseSum + set.weight! * set.reps!,
              0,
            ),
        0,
      );

      return {
        date: session.date,
        value: totalVolume,
        sessionId: session.id,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function generateWorkoutFrequencyData(
  sessions: WorkoutSession[],
  days: number = 30,
): ProgressData[] {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const dateMap = new Map<string, number>();

  // Initialize all dates with 0
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateMap.set(d.toISOString().split("T")[0], 0);
  }

  // Count workouts per day
  sessions
    .filter((session) => {
      const sessionDate = new Date(session.date);
      return (
        sessionDate >= startDate && sessionDate <= endDate && session.endedAt
      );
    })
    .forEach((session) => {
      const dateKey = session.date;
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
    });

  return Array.from(dateMap.entries()).map(([date, count]) => ({
    date,
    value: count,
  }));
}

export function generateStrengthProgressData(
  prs: PersonalRecord[],
  recordType: PersonalRecord["recordType"] = "max_weight",
): ProgressData[] {
  return prs
    .filter((pr) => pr.recordType === recordType)
    .map((pr) => ({
      date: pr.achievedAt.toISOString().split("T")[0],
      value: pr.value,
      sessionId: pr.sessionId,
      setId: pr.setId,
      reps: pr.reps,
      weight: pr.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function calculateWorkoutStreaks(sessions: WorkoutSession[]): {
  current: number;
  longest: number;
  streaks: Array<{ start: string; end: string; count: number }>;
} {
  const workoutDates = sessions
    .filter((session) => session.endedAt)
    .map((session) => session.date)
    .sort();

  if (workoutDates.length === 0) {
    return { current: 0, longest: 0, streaks: [] };
  }

  const streaks: Array<{ start: string; end: string; count: number }> = [];
  let currentStreak = {
    start: workoutDates[0],
    end: workoutDates[0],
    count: 1,
  };

  for (let i = 1; i < workoutDates.length; i++) {
    const prevDate = new Date(workoutDates[i - 1]);
    const currentDate = new Date(workoutDates[i]);
    const daysDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 1) {
      // Continue streak
      currentStreak.end = workoutDates[i];
      if (daysDiff === 1) {
        currentStreak.count++;
      }
    } else {
      // End current streak, start new one
      if (currentStreak.count > 1) {
        streaks.push({ ...currentStreak });
      }
      currentStreak = {
        start: workoutDates[i],
        end: workoutDates[i],
        count: 1,
      };
    }
  }

  // Add the last streak
  if (currentStreak.count > 1) {
    streaks.push({ ...currentStreak });
  }

  const longest = Math.max(...streaks.map((s) => s.count), 0);

  // Calculate current streak
  const today = new Date().toISOString().split("T")[0];
  const lastWorkout = workoutDates[workoutDates.length - 1];
  const daysSinceLastWorkout = Math.floor(
    (new Date(today).getTime() - new Date(lastWorkout).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  let current = 0;
  if (daysSinceLastWorkout <= 1) {
    // Find current streak
    const lastStreak = streaks[streaks.length - 1];
    if (lastStreak && lastStreak.end === lastWorkout) {
      current = lastStreak.count;
    } else {
      current = 1; // Single workout counts as streak of 1
    }
  }

  return { current, longest, streaks };
}

export function formatChartDate(
  dateString: string,
  format: "short" | "medium" | "long" = "short",
): string {
  const date = new Date(dateString);

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "medium":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      });
    case "long":
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    default:
      return dateString;
  }
}

export function getExerciseProgressTrend(
  data: ProgressData[],
): "improving" | "declining" | "stable" | "insufficient_data" {
  if (data.length < 3) return "insufficient_data";

  const recent = data.slice(-3);
  const older = data.slice(-6, -3);

  if (older.length === 0) return "insufficient_data";

  const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;

  const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (percentChange > 5) return "improving";
  if (percentChange < -5) return "declining";
  return "stable";
}

export function calculatePersonalBests(prs: PersonalRecord[]): {
  maxWeight: PersonalRecord | null;
  maxReps: PersonalRecord | null;
  maxVolume: PersonalRecord | null;
  best1RM: PersonalRecord | null;
} {
  const maxWeight = prs
    .filter((pr) => pr.recordType === "max_weight")
    .reduce(
      (best, current) => (!best || current.value > best.value ? current : best),
      null as PersonalRecord | null,
    );

  const maxReps = prs
    .filter((pr) => pr.recordType === "max_reps")
    .reduce(
      (best, current) => (!best || current.value > best.value ? current : best),
      null as PersonalRecord | null,
    );

  const maxVolume = prs
    .filter((pr) => pr.recordType === "max_volume")
    .reduce(
      (best, current) => (!best || current.value > best.value ? current : best),
      null as PersonalRecord | null,
    );

  const best1RM = prs
    .filter((pr) => pr.recordType === "best_estimated_1rm")
    .reduce(
      (best, current) => (!best || current.value > best.value ? current : best),
      null as PersonalRecord | null,
    );

  return { maxWeight, maxReps, maxVolume, best1RM };
}
