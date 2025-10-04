import { db } from './database';
import type { User, Exercise, WorkoutSession, SessionExercise, SetEntry, WorkoutTemplate, TemplateExercise, PersonalRecord, BodyMeasurement, WorkoutStreak, ExerciseProgress, WorkoutStats } from '@/lib/types';

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
    const session = await this.getSessionById(id);
    if (session) {
      await this.updateSession(id, { endedAt: new Date() });
      
      // Update workout streak
      await workoutStreakRepository.updateStreakForWorkout(session.userId, session.date);
    }
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

// Template Repository
export const templateRepository = {
  async getAllTemplates(): Promise<WorkoutTemplate[]> {
    return await db.workoutTemplates.orderBy('name').toArray();
  },

  async getTemplatesByCategory(category: WorkoutTemplate['category']): Promise<WorkoutTemplate[]> {
    return await db.workoutTemplates
      .where('category')
      .equals(category)
      .sortBy('name');
  },

  async getUserTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return await db.workoutTemplates
      .where('ownerId')
      .equals(userId)
      .sortBy('name');
  },

  async getBuiltInTemplates(): Promise<WorkoutTemplate[]> {
    return await db.workoutTemplates
      .filter(template => template.isBuiltIn === true)
      .toArray()
      .then(templates => templates.sort((a, b) => a.name.localeCompare(b.name)));
  },

  async getTemplateById(id: string): Promise<WorkoutTemplate | undefined> {
    return await db.workoutTemplates.get(id);
  },

  async createTemplate(template: Omit<WorkoutTemplate, 'createdAt' | 'updatedAt'>): Promise<WorkoutTemplate> {
    const now = new Date();
    const newTemplate = {
      ...template,
      createdAt: now,
      updatedAt: now,
    };
    await db.workoutTemplates.add(newTemplate);
    return newTemplate;
  },

  async updateTemplate(id: string, updates: Partial<WorkoutTemplate>): Promise<void> {
    await db.workoutTemplates.update(id, { ...updates, updatedAt: new Date() });
  },

  async deleteTemplate(id: string): Promise<void> {
    await db.workoutTemplates.delete(id);
  },

  async searchTemplates(query: string): Promise<WorkoutTemplate[]> {
    const lowerQuery = query.toLowerCase();
    return await db.workoutTemplates
      .filter(template => 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description?.toLowerCase().includes(lowerQuery) ||
        template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  async createTemplateFromSession(
    session: WorkoutSession,
    templateData: {
      name: string;
      description?: string;
      category: WorkoutTemplate['category'];
      difficulty: WorkoutTemplate['difficulty'];
      tags: string[];
    },
    userId: string
  ): Promise<WorkoutTemplate> {
    const templateExercises: TemplateExercise[] = session.exercises.map((sessionEx, index) => ({
      id: crypto.randomUUID(),
      exerciseId: sessionEx.exerciseId,
      exerciseName: sessionEx.nameAtTime,
      orderIndex: index,
      sets: sessionEx.sets
        .filter(set => set.completedAt && !set.isWarmup) // Only include completed, non-warmup sets
        .map((set, setIndex) => ({
          id: crypto.randomUUID(),
          index: setIndex,
          targetReps: set.reps,
          targetWeight: set.weight,
          targetRPE: set.rpe,
          isWarmup: false,
          notes: set.notes,
        })),
      restSeconds: sessionEx.sets.find(set => set.restSec)?.restSec,
    }));

    const estimatedDuration = session.startedAt && session.endedAt
      ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60))
      : 60; // Default to 60 minutes

    const template: Omit<WorkoutTemplate, 'createdAt' | 'updatedAt'> = {
      id: crypto.randomUUID(),
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      difficulty: templateData.difficulty,
      estimatedDuration,
      exercises: templateExercises,
      tags: templateData.tags,
      isBuiltIn: false,
      ownerId: userId,
      createdFromSessionId: session.id,
    };

    return await this.createTemplate(template);
  },
};

// Personal Records Repository
export const personalRecordRepository = {
  async getUserRecords(userId: string): Promise<PersonalRecord[]> {
    return await db.personalRecords
      .where('[userId+achievedAt]')
      .between([userId, ''], [userId, 'z'], true, true)
      .reverse()
      .toArray();
  },

  async getExerciseRecords(userId: string, exerciseId: string): Promise<PersonalRecord[]> {
    return await db.personalRecords
      .where('[userId+exerciseId]')
      .equals([userId, exerciseId])
      .reverse()
      .toArray();
  },

  async createRecord(record: Omit<PersonalRecord, 'createdAt'>): Promise<PersonalRecord> {
    const newRecord = {
      ...record,
      createdAt: new Date(),
    };
    await db.personalRecords.add(newRecord);
    return newRecord;
  },

  async getRecordsByType(userId: string, recordType: PersonalRecord['recordType']): Promise<PersonalRecord[]> {
    return await db.personalRecords
      .where('[userId+recordType]')
      .equals([userId, recordType])
      .reverse()
      .toArray();
  },

  async checkForNewRecord(
    userId: string, 
    exerciseId: string, 
    exerciseName: string,
    setData: { weight?: number; reps?: number; sessionId: string; setId: string }
  ): Promise<PersonalRecord[]> {
    const newRecords: PersonalRecord[] = [];
    const now = new Date();

    // Get existing records for this exercise
    const existingRecords = await this.getExerciseRecords(userId, exerciseId);
    
    const maxWeightRecord = existingRecords.find(r => r.recordType === 'max_weight');
    const maxRepsRecord = existingRecords.find(r => r.recordType === 'max_reps');
    const maxVolumeRecord = existingRecords.find(r => r.recordType === 'max_volume');

    // Check for max weight PR (if weight and reps are available)
    if (setData.weight && setData.reps) {
      if (!maxWeightRecord || setData.weight > maxWeightRecord.value) {
        newRecords.push(await this.createRecord({
          id: crypto.randomUUID(),
          userId,
          exerciseId,
          exerciseName,
          recordType: 'max_weight',
          value: setData.weight,
          reps: setData.reps,
          achievedAt: now,
          sessionId: setData.sessionId,
          setId: setData.setId,
          previousRecord: maxWeightRecord?.value,
        }));
      }

      // Check for max reps PR (at same or higher weight)
      const sameWeightRecords = existingRecords.filter(r => r.weight === setData.weight);
      const maxRepsAtWeight = Math.max(...sameWeightRecords.map(r => r.reps || 0), 0);
      
      if (!maxRepsRecord || setData.reps > maxRepsAtWeight) {
        newRecords.push(await this.createRecord({
          id: crypto.randomUUID(),
          userId,
          exerciseId,
          exerciseName,
          recordType: 'max_reps',
          value: setData.reps,
          weight: setData.weight,
          achievedAt: now,
          sessionId: setData.sessionId,
          setId: setData.setId,
          previousRecord: maxRepsAtWeight || undefined,
        }));
      }

      // Check for max volume PR (weight * reps)
      const volume = setData.weight * setData.reps;
      if (!maxVolumeRecord || volume > maxVolumeRecord.value) {
        newRecords.push(await this.createRecord({
          id: crypto.randomUUID(),
          userId,
          exerciseId,
          exerciseName,
          recordType: 'max_volume',
          value: volume,
          weight: setData.weight,
          reps: setData.reps,
          achievedAt: now,
          sessionId: setData.sessionId,
          setId: setData.setId,
          previousRecord: maxVolumeRecord?.value,
        }));
      }

      // Calculate estimated 1RM using Brzycki formula
      const estimated1RM = setData.weight * (36 / (37 - setData.reps));
      const best1RMRecord = existingRecords.find(r => r.recordType === 'best_estimated_1rm');
      
      if (!best1RMRecord || estimated1RM > best1RMRecord.value) {
        newRecords.push(await this.createRecord({
          id: crypto.randomUUID(),
          userId,
          exerciseId,
          exerciseName,
          recordType: 'best_estimated_1rm',
          value: Math.round(estimated1RM * 100) / 100, // Round to 2 decimal places
          weight: setData.weight,
          reps: setData.reps,
          achievedAt: now,
          sessionId: setData.sessionId,
          setId: setData.setId,
          previousRecord: best1RMRecord?.value,
        }));
      }
    }

    return newRecords;
  },
};

// Body Measurements Repository
export const bodyMeasurementRepository = {
  async getUserMeasurements(userId: string): Promise<BodyMeasurement[]> {
    return await db.bodyMeasurements
      .where('[userId+date]')
      .between([userId, ''], [userId, 'z'], true, true)
      .reverse()
      .toArray();
  },

  async getMeasurementsByType(userId: string, measurementType: BodyMeasurement['measurementType']): Promise<BodyMeasurement[]> {
    return await db.bodyMeasurements
      .where('[userId+measurementType]')
      .equals([userId, measurementType])
      .reverse()
      .toArray();
  },

  async createMeasurement(measurement: Omit<BodyMeasurement, 'createdAt'>): Promise<BodyMeasurement> {
    const newMeasurement = {
      ...measurement,
      createdAt: new Date(),
    };
    await db.bodyMeasurements.add(newMeasurement);
    return newMeasurement;
  },

  async updateMeasurement(id: string, updates: Partial<BodyMeasurement>): Promise<void> {
    await db.bodyMeasurements.update(id, updates);
  },

  async deleteMeasurement(id: string): Promise<void> {
    await db.bodyMeasurements.delete(id);
  },
};

// Workout Streaks Repository
export const workoutStreakRepository = {
  async getCurrentStreak(userId: string): Promise<WorkoutStreak | undefined> {
    return await db.workoutStreaks
      .where('[userId+isCurrent]')
      .equals([userId, 1]) // Use 1 for true in IndexedDB queries
      .first();
  },

  async getUserStreaks(userId: string): Promise<WorkoutStreak[]> {
    return await db.workoutStreaks
      .where('userId')
      .equals(userId)
      .reverse()
      .toArray();
  },

  async updateStreakForWorkout(userId: string, workoutDate: string): Promise<WorkoutStreak> {
    const currentStreak = await this.getCurrentStreak(userId);
    const workoutDay = new Date(workoutDate);
    const yesterday = new Date(workoutDay);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (currentStreak) {
      const streakEndDate = new Date(currentStreak.endDate || currentStreak.startDate);
      const daysDiff = Math.floor((workoutDay.getTime() - streakEndDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        // Continue current streak
        const updatedStreak = {
          ...currentStreak,
          endDate: workoutDate,
          workoutCount: currentStreak.workoutCount + 1,
          updatedAt: new Date(),
        };
        await db.workoutStreaks.update(currentStreak.id, updatedStreak);
        return updatedStreak;
      } else {
        // End current streak and start new one
        await db.workoutStreaks.update(currentStreak.id, { 
          isCurrent: false, 
          updatedAt: new Date() 
        });
        
        return await this.createStreak({
          id: crypto.randomUUID(),
          userId,
          startDate: workoutDate,
          endDate: workoutDate,
          workoutCount: 1,
          isCurrent: true,
        });
      }
    } else {
      // Create first streak
      return await this.createStreak({
        id: crypto.randomUUID(),
        userId,
        startDate: workoutDate,
        endDate: workoutDate,
        workoutCount: 1,
        isCurrent: true,
      });
    }
  },

  async createStreak(streak: Omit<WorkoutStreak, 'createdAt' | 'updatedAt'>): Promise<WorkoutStreak> {
    const now = new Date();
    const newStreak = {
      ...streak,
      createdAt: now,
      updatedAt: now,
    };
    await db.workoutStreaks.add(newStreak);
    return newStreak;
  },
};

// Analytics Repository
export const analyticsRepository = {
  async getExerciseProgress(userId: string, exerciseId: string): Promise<ExerciseProgress | null> {
    // Get all sessions with this exercise
    const sessions = await db.workoutSessions
      .where('[userId+date]')
      .between([userId, ''], [userId, 'z'], true, true)
      .toArray();

    const sessionExercises = await db.sessionExercises
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();

    const relevantSessionExercises = sessionExercises.filter(se => 
      sessions.some(s => s.id === se.sessionId)
    );

    if (relevantSessionExercises.length === 0) return null;

    // Calculate stats
    const totalSets = relevantSessionExercises.reduce((sum, se) => 
      sum + se.sets.filter(set => set.completedAt && !set.isWarmup).length, 0
    );

    const totalVolume = relevantSessionExercises.reduce((sum, se) => 
      sum + se.sets
        .filter(set => set.completedAt && !set.isWarmup && set.weight && set.reps)
        .reduce((vol, set) => vol + (set.weight! * set.reps!), 0), 0
    );

    const allWeights = relevantSessionExercises.flatMap(se => 
      se.sets
        .filter(set => set.completedAt && set.weight)
        .map(set => set.weight!)
    );

    const allReps = relevantSessionExercises.flatMap(se => 
      se.sets
        .filter(set => set.completedAt && set.reps)
        .map(set => set.reps!)
    );

    const maxWeight = Math.max(...allWeights, 0);
    const maxReps = Math.max(...allReps, 0);

    // Simple 1RM estimation
    const bestSet = relevantSessionExercises.flatMap(se => se.sets)
      .filter(set => set.completedAt && set.weight && set.reps)
      .reduce((best, set) => {
        const estimated1RM = set.weight! * (36 / (37 - set.reps!));
        const bestEstimated1RM = best ? best.weight! * (36 / (37 - best.reps!)) : 0;
        return estimated1RM > bestEstimated1RM ? set : best;
      }, null as SetEntry | null);

    const estimated1RM = bestSet && bestSet.weight && bestSet.reps ? bestSet.weight * (36 / (37 - bestSet.reps)) : 0;

    const lastSession = sessions
      .filter(s => relevantSessionExercises.some(se => se.sessionId === s.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // Get recent PRs
    const recentPRs = await personalRecordRepository.getExerciseRecords(userId, exerciseId);

    // Simple trend calculation (could be enhanced)
    let trend: 'improving' | 'declining' | 'stable' | 'new' = 'new';
    if (relevantSessionExercises.length >= 3) {
      const recentSessions = relevantSessionExercises.slice(-3);
      const oldSessions = relevantSessionExercises.slice(-6, -3);
      
      if (oldSessions.length > 0) {
        const recentAvgVolume = recentSessions.reduce((sum, se) => 
          sum + se.sets.filter(set => set.completedAt && set.weight && set.reps)
            .reduce((vol, set) => vol + (set.weight! * set.reps!), 0), 0
        ) / recentSessions.length;

        const oldAvgVolume = oldSessions.reduce((sum, se) => 
          sum + se.sets.filter(set => set.completedAt && set.weight && set.reps)
            .reduce((vol, set) => vol + (set.weight! * set.reps!), 0), 0
        ) / oldSessions.length;

        const percentChange = ((recentAvgVolume - oldAvgVolume) / oldAvgVolume) * 100;
        
        if (percentChange > 5) trend = 'improving';
        else if (percentChange < -5) trend = 'declining';
        else trend = 'stable';
      }
    }

    return {
      exerciseId,
      exerciseName: relevantSessionExercises[0]?.nameAtTime || '',
      totalSessions: new Set(relevantSessionExercises.map(se => se.sessionId)).size,
      totalSets,
      totalVolume,
      maxWeight,
      maxReps,
      estimated1RM: Math.round(estimated1RM * 100) / 100,
      lastPerformed: new Date(lastSession?.date || Date.now()),
      trend,
      recentPRs: recentPRs.slice(0, 3),
    };
  },

  async getWorkoutStats(userId: string): Promise<WorkoutStats> {
    const sessions = await sessionRepository.getUserSessions(userId);
    const currentStreak = await workoutStreakRepository.getCurrentStreak(userId);
    const allStreaks = await workoutStreakRepository.getUserStreaks(userId);
    const recentPRs = await personalRecordRepository.getUserRecords(userId);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const workoutsThisWeek = sessions.filter(s => 
      new Date(s.date) >= oneWeekAgo
    ).length;

    const workoutsThisMonth = sessions.filter(s => 
      new Date(s.date) >= oneMonthAgo
    ).length;

    const totalDuration = sessions.reduce((sum, s) => {
      if (s.startedAt && s.endedAt) {
        return sum + Math.floor((s.endedAt.getTime() - s.startedAt.getTime()) / (1000 * 60));
      }
      return sum;
    }, 0);

    const totalVolume = sessions.reduce((sum, s) => 
      sum + s.exercises.reduce((exSum, ex) => 
        exSum + ex.sets
          .filter(set => set.completedAt && set.weight && set.reps)
          .reduce((setSum, set) => setSum + (set.weight! * set.reps!), 0), 0
      ), 0
    );

    // Calculate favorite exercises
    const exerciseCount = new Map<string, { name: string; count: number }>();
    sessions.forEach(s => 
      s.exercises.forEach(ex => {
        const current = exerciseCount.get(ex.exerciseId) || { name: ex.nameAtTime, count: 0 };
        exerciseCount.set(ex.exerciseId, { name: current.name, count: current.count + 1 });
      })
    );

    const favoriteExercises = Array.from(exerciseCount.entries())
      .map(([exerciseId, data]) => ({ exerciseId, exerciseName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalWorkouts: sessions.length,
      totalDuration,
      totalVolume,
      averageWorkoutDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
      workoutsThisWeek,
      workoutsThisMonth,
      currentStreak: currentStreak?.workoutCount || 0,
      longestStreak: Math.max(...allStreaks.map(s => s.workoutCount), 0),
      favoriteExercises,
      recentPRs: recentPRs.slice(0, 5),
    };
  },
};