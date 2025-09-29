// Core entity types for MVP

export interface User {
  id: string;
  displayName: string;
  email?: string;
  unitSystem: 'metric' | 'imperial';
  defaultRestSec?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  muscles: string[];
  equipment?: string;
  isCustom: boolean;
  ownerId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startedAt?: Date;
  endedAt?: Date;
  exercises: SessionExercise[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  nameAtTime: string; // Exercise name frozen at time of session
  sets: SetEntry[];
  notes?: string;
  orderIndex: number;
}

export interface SetEntry {
  id: string;
  index: number;
  reps?: number;
  weight?: number;
  timeSec?: number;
  restSec?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  isWarmup?: boolean;
  completedAt?: Date;
  notes?: string;
}

// Utility types
export type UnitSystem = 'metric' | 'imperial';

export interface SessionSummary {
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  totalVolume: number;
  duration: number; // in minutes
  exerciseCount: number;
}

// Form types
export interface CreateSessionExerciseForm {
  exerciseId: string;
  sets: Omit<SetEntry, 'id' | 'completedAt'>[];
}

export interface StartWorkoutForm {
  date?: string;
  notes?: string;
}