import Dexie, { type EntityTable } from 'dexie';
import type { User, Exercise, WorkoutSession, SessionExercise } from '@/lib/types';

// Simplified schema for MVP - flattened structure for easier queries

export class GymTrackerDatabase extends Dexie {
  users!: EntityTable<User, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  workoutSessions!: EntityTable<WorkoutSession, 'id'>;
  sessionExercises!: EntityTable<SessionExercise, 'id'>;

  constructor() {
    super('GymTrackerDB');
    
    this.version(1).stores({
      users: 'id, email, unitSystem',
      exercises: 'id, name, isCustom, [isCustom+name]',
      workoutSessions: 'id, userId, date, [userId+date]',
      sessionExercises: 'id, sessionId, exerciseId, orderIndex, [sessionId+orderIndex]',
    });
  }
}

export const db = new GymTrackerDatabase();