import { db } from './database';
import { exerciseRepository, userRepository } from './repositories';
import { seedExercises } from '@/data/exercises';
import type { User } from '@/lib/types';

export async function seedDatabase() {
  const existingUser = await userRepository.getCurrentUser();
  
  // Only seed if no user exists (first time setup)
  if (!existingUser) {
    console.log('Seeding database...');
    
    // Create default user
    const defaultUser: Omit<User, 'createdAt' | 'updatedAt'> = {
      id: crypto.randomUUID(),
      displayName: 'Gym User',
      unitSystem: 'metric',
      defaultRestSec: 90,
    };
    
    await userRepository.createUser(defaultUser);
    console.log('Default user created');
    
    // Seed exercises
    const existingExercises = await exerciseRepository.getAllExercises();
    if (existingExercises.length === 0) {
      for (const exercise of seedExercises) {
        await exerciseRepository.createExercise(exercise);
      }
      console.log(`Seeded ${seedExercises.length} exercises`);
    }
    
    console.log('Database seeding completed');
  }
}

export async function reseedExercises() {
  try {
    console.log('Clearing existing exercises...');
    
    // Get all exercises and delete custom ones, then delete built-in ones
    const allExercises = await exerciseRepository.getAllExercises();
    
    for (const exercise of allExercises) {
      await exerciseRepository.deleteExercise(exercise.id);
    }
    
    console.log(`Cleared ${allExercises.length} existing exercises`);
    
    // Reseed with new exercises
    for (const exercise of seedExercises) {
      await exerciseRepository.createExercise(exercise);
    }
    
    console.log(`Reseeded ${seedExercises.length} exercises`);
    console.log('Exercise reseeding completed successfully');
    
    return { cleared: allExercises.length, seeded: seedExercises.length };
  } catch (error) {
    console.error('Exercise reseeding failed:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    await db.open();
    await seedDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}