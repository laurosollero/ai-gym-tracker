import Dexie, { type EntityTable } from "dexie";
import type {
  User,
  Exercise,
  WorkoutSession,
  SessionExercise,
  WorkoutTemplate,
  PersonalRecord,
  BodyMeasurement,
  WorkoutStreak,
} from "@/lib/types";

// Simplified schema for MVP - flattened structure for easier queries

export class GymTrackerDatabase extends Dexie {
  users!: EntityTable<User, "id">;
  exercises!: EntityTable<Exercise, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  sessionExercises!: EntityTable<SessionExercise, "id">;
  workoutTemplates!: EntityTable<WorkoutTemplate, "id">;
  personalRecords!: EntityTable<PersonalRecord, "id">;
  bodyMeasurements!: EntityTable<BodyMeasurement, "id">;
  workoutStreaks!: EntityTable<WorkoutStreak, "id">;

  constructor() {
    super("GymTrackerDB");

    this.version(1).stores({
      users: "id, email, unitSystem",
      exercises: "id, name, isCustom, [isCustom+name]",
      workoutSessions: "id, userId, date, [userId+date]",
      sessionExercises:
        "id, sessionId, exerciseId, orderIndex, [sessionId+orderIndex]",
      workoutTemplates:
        "id, name, category, difficulty, ownerId, [ownerId+category], [category+difficulty]",
      personalRecords:
        "id, userId, exerciseId, recordType, achievedAt, [userId+exerciseId], [userId+recordType], [exerciseId+recordType], [userId+achievedAt]",
      bodyMeasurements:
        "id, userId, measurementType, date, [userId+measurementType], [userId+date]",
      workoutStreaks: "id, userId, isCurrent, startDate, [userId+isCurrent]",
    });

    // Version 2: Add exercise media fields (instructions, videoUrl, gifUrl, imageUrl)
    this.version(2).stores({
      users: "id, email, unitSystem",
      exercises: "id, name, isCustom, [isCustom+name]",
      workoutSessions: "id, userId, date, [userId+date]",
      sessionExercises:
        "id, sessionId, exerciseId, orderIndex, [sessionId+orderIndex]",
      workoutTemplates:
        "id, name, category, difficulty, ownerId, [ownerId+category], [category+difficulty]",
      personalRecords:
        "id, userId, exerciseId, recordType, achievedAt, [userId+exerciseId], [userId+recordType], [exerciseId+recordType], [userId+achievedAt]",
      bodyMeasurements:
        "id, userId, measurementType, date, [userId+measurementType], [userId+date]",
      workoutStreaks: "id, userId, isCurrent, startDate, [userId+isCurrent]",
    });
  }
}

export const db = new GymTrackerDatabase();
