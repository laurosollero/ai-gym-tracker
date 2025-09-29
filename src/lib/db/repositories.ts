import { db } from './database';
import type { User, Exercise, WorkoutSession, SessionExercise, SetEntry } from '@/lib/types';

// User Repository
export const userRepository = {
  async getCurrentUser(): Promise<User | undefined> {
    const users = await db.users.toArray();
    return users[0]; // MVP: single user
  },

  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const newUser = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    await db.users.add(newUser);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db.users.update(id, { ...updates, updatedAt: new Date() });
  },
};

// Exercise Repository
export const exerciseRepository = {
  async getAllExercises(): Promise<Exercise[]> {
    return await db.exercises.orderBy('name').toArray();
  },

  async searchExercises(query: string): Promise<Exercise[]> {
    return await db.exercises
      .where('name')
      .startsWithIgnoreCase(query)
      .or('name')
      .startsWithIgnoreCase(query.toLowerCase())
      .toArray();
  },

  async getExerciseById(id: string): Promise<Exercise | undefined> {
    return await db.exercises.get(id);
  },

  async createExercise(exercise: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<Exercise> {
    const now = new Date();
    const newExercise = {
      ...exercise,
      createdAt: now,
      updatedAt: now,
    };
    await db.exercises.add(newExercise);
    return newExercise;
  },

  async getMuscleGroups(): Promise<string[]> {
    const exercises = await db.exercises.toArray();
    const muscleSet = new Set<string>();
    exercises.forEach(ex => ex.muscles.forEach(m => muscleSet.add(m)));
    return Array.from(muscleSet).sort();
  },
};

// Session Repository
export const sessionRepository = {
  async createSession(session: Omit<WorkoutSession, 'createdAt' | 'updatedAt'>): Promise<WorkoutSession> {
    const now = new Date();
    const newSession = {
      ...session,
      createdAt: now,
      updatedAt: now,
    };
    await db.workoutSessions.add(newSession);
    return newSession;
  },

  async getSessionById(id: string): Promise<WorkoutSession | undefined> {
    const session = await db.workoutSessions.get(id);
    if (!session) return undefined;

    // Load exercises for this session
    const exercises = await db.sessionExercises
      .where('sessionId')
      .equals(id)
      .sortBy('orderIndex');

    return {
      ...session,
      exercises,
    };
  },

  async getUserSessions(userId: string, limit?: number): Promise<WorkoutSession[]> {
    let query = db.workoutSessions
      .where('[userId+date]')
      .between([userId, ''], [userId, 'z'], true, true)
      .reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const sessions = await query.toArray();
    
    // Load exercises for each session
    const sessionsWithExercises = await Promise.all(
      sessions.map(async (session) => {
        const exercises = await db.sessionExercises
          .where('sessionId')
          .equals(session.id)
          .sortBy('orderIndex');
        return { ...session, exercises };
      })
    );

    return sessionsWithExercises;
  },

  async updateSession(id: string, updates: Partial<WorkoutSession>): Promise<void> {
    await db.workoutSessions.update(id, { ...updates, updatedAt: new Date() });
  },

  async finishSession(id: string): Promise<void> {
    await this.updateSession(id, { endedAt: new Date() });
  },
};

// Session Exercise Repository
export const sessionExerciseRepository = {
  async addExerciseToSession(
    sessionId: string,
    exerciseId: string,
    nameAtTime: string,
    orderIndex: number
  ): Promise<SessionExercise> {
    const sessionExercise: SessionExercise = {
      id: crypto.randomUUID(),
      sessionId,
      exerciseId,
      nameAtTime,
      sets: [],
      orderIndex,
    };
    
    await db.sessionExercises.add(sessionExercise);
    return sessionExercise;
  },

  async updateSessionExercise(id: string, updates: Partial<SessionExercise>): Promise<void> {
    await db.sessionExercises.update(id, updates);
  },

  async addSetToExercise(sessionExerciseId: string, set: Omit<SetEntry, 'id'>): Promise<void> {
    const sessionExercise = await db.sessionExercises.get(sessionExerciseId);
    if (!sessionExercise) throw new Error('Session exercise not found');

    const newSet: SetEntry = {
      ...set,
      id: crypto.randomUUID(),
    };

    const updatedSets = [...sessionExercise.sets, newSet];
    await this.updateSessionExercise(sessionExerciseId, { sets: updatedSets });
  },

  async updateSet(sessionExerciseId: string, setId: string, updates: Partial<SetEntry>): Promise<void> {
    const sessionExercise = await db.sessionExercises.get(sessionExerciseId);
    if (!sessionExercise) throw new Error('Session exercise not found');

    const updatedSets = sessionExercise.sets.map(set =>
      set.id === setId ? { ...set, ...updates } : set
    );
    
    await this.updateSessionExercise(sessionExerciseId, { sets: updatedSets });
  },
};