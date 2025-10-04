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

// Template types
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting' | 'bodybuilding' | 'general' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  exercises: TemplateExercise[];
  tags: string[];
  isBuiltIn: boolean;
  ownerId?: string;
  createdFromSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  sets: TemplateSet[];
  notes?: string;
  restSeconds?: number;
}

export interface TemplateSet {
  id: string;
  index: number;
  targetReps?: number;
  targetWeight?: number;
  targetRPE?: number;
  isWarmup?: boolean;
  notes?: string;
}

// Analytics types
export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  recordType: 'max_weight' | 'max_reps' | 'max_volume' | 'best_estimated_1rm';
  value: number;
  reps?: number; // For max_weight records
  weight?: number; // For max_reps records
  achievedAt: Date;
  sessionId: string;
  setId: string;
  previousRecord?: number;
  createdAt: Date;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  measurementType: 'weight' | 'body_fat' | 'muscle_mass' | 'chest' | 'waist' | 'hips' | 'thigh' | 'bicep' | 'neck';
  value: number;
  unit: string; // kg, lbs, cm, inches, %
  date: string; // ISO date string
  notes?: string;
  createdAt: Date;
}

export interface WorkoutStreak {
  id: string;
  userId: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, null if current streak
  workoutCount: number;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics summary types
export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  totalSessions: number;
  totalSets: number;
  totalVolume: number;
  maxWeight: number;
  maxReps: number;
  estimated1RM: number;
  lastPerformed: Date;
  trend: 'improving' | 'declining' | 'stable' | 'new';
  recentPRs: PersonalRecord[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // minutes
  totalVolume: number;
  averageWorkoutDuration: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  favoriteExercises: { exerciseId: string; exerciseName: string; count: number }[];
  recentPRs: PersonalRecord[];
}

export interface ProgressData {
  date: string;
  value: number;
  sessionId?: string;
  setId?: string;
  reps?: number;
  weight?: number;
}

// Form types
export interface CreateSessionExerciseForm {
  exerciseId: string;
  sets: Omit<SetEntry, 'id' | 'completedAt'>[];
}

export interface StartWorkoutForm {
  date?: string;
  notes?: string;
  templateId?: string;
}

export interface CreateTemplateForm {
  name: string;
  description?: string;
  category: WorkoutTemplate['category'];
  difficulty: WorkoutTemplate['difficulty'];
  estimatedDuration: number;
  tags: string[];
}

export interface BodyMeasurementForm {
  measurementType: BodyMeasurement['measurementType'];
  value: number;
  unit: string;
  date: string;
  notes?: string;
}