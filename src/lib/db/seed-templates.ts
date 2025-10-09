import { templateRepository, exerciseRepository } from "./repositories";
import type { WorkoutTemplate, TemplateExercise } from "@/lib/types";

// Template seed data types
interface SeedTemplateSet {
  targetReps: number;
  targetWeight?: number;
  targetRPE?: number;
  isWarmup?: boolean;
  notes?: string;
}

interface SeedTemplateExercise {
  exerciseName: string;
  muscles: string[];
  sets: SeedTemplateSet[];
  restSeconds?: number;
  notes?: string;
}

// Built-in popular workout templates
const BUILT_IN_TEMPLATES = [
  {
    name: "Push Day (Beginner)",
    description:
      "A beginner-friendly push workout focusing on chest, shoulders, and triceps",
    category: "strength" as const,
    difficulty: "beginner" as const,
    estimatedDuration: 45,
    tags: ["push", "upper body", "beginner", "chest", "shoulders"],
    exercises: [
      {
        exerciseName: "Push-ups",
        muscles: ["chest", "triceps", "shoulders"],
        sets: [
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
        ],
        restSeconds: 60,
      },
      {
        exerciseName: "Overhead Press (Dumbbell)",
        muscles: ["shoulders", "triceps"],
        sets: [
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
        ],
        restSeconds: 90,
      },
      {
        exerciseName: "Chest Press (Dumbbell)",
        muscles: ["chest", "triceps", "shoulders"],
        sets: [
          { targetReps: 12, isWarmup: false },
          { targetReps: 12, isWarmup: false },
          { targetReps: 12, isWarmup: false },
        ],
        restSeconds: 90,
      },
      {
        exerciseName: "Tricep Dips",
        muscles: ["triceps", "chest"],
        sets: [
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
        ],
        restSeconds: 60,
      },
    ],
  },
  {
    name: "Pull Day (Beginner)",
    description: "A beginner-friendly pull workout focusing on back and biceps",
    category: "strength" as const,
    difficulty: "beginner" as const,
    estimatedDuration: 45,
    tags: ["pull", "upper body", "beginner", "back", "biceps"],
    exercises: [
      {
        exerciseName: "Pull-ups (Assisted)",
        muscles: ["back", "biceps"],
        sets: [
          { targetReps: 5, isWarmup: false },
          { targetReps: 5, isWarmup: false },
          { targetReps: 5, isWarmup: false },
        ],
        restSeconds: 120,
      },
      {
        exerciseName: "Bent Over Row (Dumbbell)",
        muscles: ["back", "biceps"],
        sets: [
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
        ],
        restSeconds: 90,
      },
      {
        exerciseName: "Face Pulls",
        muscles: ["rear delts", "rhomboids"],
        sets: [
          { targetReps: 15, isWarmup: false },
          { targetReps: 15, isWarmup: false },
        ],
        restSeconds: 60,
      },
      {
        exerciseName: "Bicep Curls (Dumbbell)",
        muscles: ["biceps"],
        sets: [
          { targetReps: 12, isWarmup: false },
          { targetReps: 12, isWarmup: false },
          { targetReps: 12, isWarmup: false },
        ],
        restSeconds: 60,
      },
    ],
  },
  {
    name: "Leg Day (Beginner)",
    description:
      "A comprehensive beginner leg workout targeting all major muscle groups",
    category: "strength" as const,
    difficulty: "beginner" as const,
    estimatedDuration: 50,
    tags: ["legs", "lower body", "beginner", "squats", "glutes"],
    exercises: [
      {
        exerciseName: "Bodyweight Squats",
        muscles: ["quadriceps", "glutes"],
        sets: [
          { targetReps: 15, isWarmup: true },
          { targetReps: 15, isWarmup: false },
          { targetReps: 15, isWarmup: false },
          { targetReps: 15, isWarmup: false },
        ],
        restSeconds: 60,
      },
      {
        exerciseName: "Romanian Deadlift (Dumbbell)",
        muscles: ["hamstrings", "glutes"],
        sets: [
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
        ],
        restSeconds: 90,
      },
      {
        exerciseName: "Walking Lunges",
        muscles: ["quadriceps", "glutes"],
        sets: [
          { targetReps: 20, isWarmup: false },
          { targetReps: 20, isWarmup: false },
        ],
        restSeconds: 60,
      },
      {
        exerciseName: "Calf Raises",
        muscles: ["calves"],
        sets: [
          { targetReps: 20, isWarmup: false },
          { targetReps: 20, isWarmup: false },
          { targetReps: 20, isWarmup: false },
        ],
        restSeconds: 45,
      },
    ],
  },
  {
    name: "Upper/Lower Split (Intermediate)",
    description: "An intermediate upper body workout with compound movements",
    category: "hypertrophy" as const,
    difficulty: "intermediate" as const,
    estimatedDuration: 60,
    tags: ["upper body", "intermediate", "compound", "hypertrophy"],
    exercises: [
      {
        exerciseName: "Bench Press (Barbell)",
        muscles: ["chest", "triceps", "shoulders"],
        sets: [
          { targetReps: 12, targetWeight: 135, isWarmup: true },
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
          { targetReps: 10, isWarmup: false },
        ],
        restSeconds: 120,
      },
      {
        exerciseName: "Pull-ups",
        muscles: ["back", "biceps"],
        sets: [
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
          { targetReps: 6, isWarmup: false },
        ],
        restSeconds: 120,
      },
      {
        exerciseName: "Overhead Press (Barbell)",
        muscles: ["shoulders", "triceps"],
        sets: [
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
          { targetReps: 8, isWarmup: false },
        ],
        restSeconds: 90,
      },
      {
        exerciseName: "Barbell Rows",
        muscles: ["back", "biceps"],
        sets: [
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
        ],
        restSeconds: 90,
      },
    ],
  },
  {
    name: "Quick HIIT (20min)",
    description: "High-intensity interval training for time-crunched days",
    category: "endurance" as const,
    difficulty: "intermediate" as const,
    estimatedDuration: 20,
    tags: ["hiit", "quick", "cardio", "full body", "intense"],
    exercises: [
      {
        exerciseName: "Burpees",
        muscles: ["full body"],
        sets: [
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
          { targetReps: 10, isWarmup: false },
        ],
        restSeconds: 30,
      },
      {
        exerciseName: "Mountain Climbers",
        muscles: ["core", "shoulders"],
        sets: [
          { targetReps: 20, isWarmup: false },
          { targetReps: 20, isWarmup: false },
          { targetReps: 20, isWarmup: false },
          { targetReps: 20, isWarmup: false },
        ],
        restSeconds: 30,
      },
      {
        exerciseName: "Jump Squats",
        muscles: ["quadriceps", "glutes"],
        sets: [
          { targetReps: 15, isWarmup: false },
          { targetReps: 15, isWarmup: false },
          { targetReps: 15, isWarmup: false },
          { targetReps: 15, isWarmup: false },
        ],
        restSeconds: 30,
      },
    ],
  },
];

export async function seedBuiltInTemplates() {
  console.log("Seeding built-in templates...");

  try {
    // Check if templates already exist
    const existingTemplates = await templateRepository.getBuiltInTemplates();
    if (existingTemplates.length > 0) {
      console.log(
        `${existingTemplates.length} built-in templates already exist, skipping seed`,
      );
      return;
    }

    // Get all exercises to match names to IDs
    const exercises = await exerciseRepository.getAllExercises();
    const exerciseMap = new Map(
      exercises.map((ex) => [ex.name.toLowerCase(), ex]),
    );

    // Create templates
    for (const templateData of BUILT_IN_TEMPLATES) {
      const templateExercises: TemplateExercise[] = [];

      for (let i = 0; i < templateData.exercises.length; i++) {
        const exerciseData = templateData.exercises[i];

        // Find existing exercise or create a custom one
        let exercise = exerciseMap.get(exerciseData.exerciseName.toLowerCase());
        if (!exercise) {
          // Create a basic exercise for the template
          exercise = await exerciseRepository.createExercise({
            id: crypto.randomUUID(),
            name: exerciseData.exerciseName,
            muscles: exerciseData.muscles,
            isCustom: false, // Built-in template exercises are not custom
          });
          exerciseMap.set(exercise.name.toLowerCase(), exercise);
        }

        const templateSets = exerciseData.sets.map((set, setIndex) => ({
          id: crypto.randomUUID(),
          index: setIndex,
          targetReps: set.targetReps,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          targetWeight: (set as any).targetWeight as number | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          targetRPE: (set as any).targetRPE as number | undefined,
          isWarmup: set.isWarmup || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          notes: (set as any).notes as string | undefined,
        }));

        templateExercises.push({
          id: crypto.randomUUID(),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          orderIndex: i,
          sets: templateSets,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          notes: (exerciseData as any).notes as string | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          restSeconds: (exerciseData as any).restSeconds as number | undefined,
        });
      }

      const template: Omit<WorkoutTemplate, "createdAt" | "updatedAt"> = {
        id: crypto.randomUUID(),
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        difficulty: templateData.difficulty,
        estimatedDuration: templateData.estimatedDuration,
        exercises: templateExercises,
        tags: templateData.tags,
        isBuiltIn: true,
        ownerId: undefined,
      };

      await templateRepository.createTemplate(template);
      console.log(`Created template: ${template.name}`);
    }

    console.log(
      `Successfully seeded ${BUILT_IN_TEMPLATES.length} built-in templates`,
    );
  } catch (error) {
    console.error("Failed to seed built-in templates:", error);
    throw error;
  }
}
