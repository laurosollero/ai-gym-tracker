import type { Exercise } from '@/lib/types';

export const seedExercises: Omit<Exercise, 'createdAt' | 'updatedAt'>[] = [
  // Chest
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    equipment: 'Barbell',
    isCustom: false,
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    equipment: 'Barbell',
    isCustom: false,
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Press',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    equipment: 'Dumbbells',
    isCustom: false,
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    equipment: 'Bodyweight',
    isCustom: false,
  },

  // Back
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscles: ['Back', 'Glutes', 'Hamstrings'],
    equipment: 'Barbell',
    isCustom: false,
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    muscles: ['Back', 'Biceps'],
    equipment: 'Bodyweight',
    isCustom: false,
  },
  {
    id: 'barbell-rows',
    name: 'Barbell Rows',
    muscles: ['Back', 'Biceps'],
    equipment: 'Barbell',
    isCustom: false,
  },
  {
    id: 'lat-pulldowns',
    name: 'Lat Pulldowns',
    muscles: ['Back', 'Biceps'],
    equipment: 'Cable Machine',
    isCustom: false,
  },

  // Legs
  {
    id: 'squat',
    name: 'Squat',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Barbell',
    isCustom: false,
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Machine',
    isCustom: false,
  },
  {
    id: 'lunges',
    name: 'Lunges',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Dumbbells',
    isCustom: false,
  },
  {
    id: 'leg-curls',
    name: 'Leg Curls',
    muscles: ['Hamstrings'],
    equipment: 'Machine',
    isCustom: false,
  },
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    muscles: ['Calves'],
    equipment: 'Dumbbells',
    isCustom: false,
  },

  // Shoulders
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscles: ['Shoulders', 'Triceps'],
    equipment: 'Barbell',
    isCustom: false,
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    muscles: ['Shoulders'],
    equipment: 'Dumbbells',
    isCustom: false,
  },
  {
    id: 'rear-delt-flyes',
    name: 'Rear Delt Flyes',
    muscles: ['Shoulders'],
    equipment: 'Dumbbells',
    isCustom: false,
  },

  // Arms
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    muscles: ['Biceps'],
    equipment: 'Dumbbells',
    isCustom: false,
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    muscles: ['Triceps'],
    equipment: 'Bodyweight',
    isCustom: false,
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    muscles: ['Triceps', 'Chest'],
    equipment: 'Barbell',
    isCustom: false,
  },

  // Core
  {
    id: 'planks',
    name: 'Planks',
    muscles: ['Core'],
    equipment: 'Bodyweight',
    isCustom: false,
  },
  {
    id: 'crunches',
    name: 'Crunches',
    muscles: ['Core'],
    equipment: 'Bodyweight',
    isCustom: false,
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    muscles: ['Core'],
    equipment: 'Bodyweight',
    isCustom: false,
  },
];