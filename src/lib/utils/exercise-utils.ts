// Exercise utility functions for normalization and consistency

// Standardized muscle group names in Title Case
export const STANDARD_MUSCLE_GROUPS = {
  // Primary muscle groups
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quadriceps: "Quadriceps",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  core: "Core",
  abs: "Core", // Map abs to core
  abdominals: "Core", // Map abdominals to core

  // Specific areas
  "rear delts": "Rear Delts",
  "rear delt": "Rear Delts",
  rhomboids: "Rhomboids",
  traps: "Traps",
  lats: "Lats",
  forearms: "Forearms",

  // General
  "full body": "Full Body",
  cardio: "Cardio",
} as const;

// Equipment standardization
export const STANDARD_EQUIPMENT = {
  barbell: "Barbell",
  dumbbells: "Dumbbells",
  dumbbell: "Dumbbells",
  "cable machine": "Cable Machine",
  cable: "Cable Machine",
  machine: "Machine",
  bodyweight: "Bodyweight",
  "smith machine": "Smith Machine",
  "resistance band": "Resistance Band",
  kettlebell: "Kettlebell",
  other: "Other",
} as const;

/**
 * Normalize muscle group names to standard Title Case format
 */
export function normalizeMuscleGroups(muscles: string[]): string[] {
  return muscles.map((muscle) => {
    const normalized = muscle.toLowerCase().trim();
    return (
      STANDARD_MUSCLE_GROUPS[
        normalized as keyof typeof STANDARD_MUSCLE_GROUPS
      ] ||
      muscle
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    );
  });
}

/**
 * Normalize equipment name to standard format
 */
export function normalizeEquipment(
  equipment: string | undefined,
): string | undefined {
  if (!equipment) return undefined;

  const normalized = equipment.toLowerCase().trim();
  return (
    STANDARD_EQUIPMENT[normalized as keyof typeof STANDARD_EQUIPMENT] ||
    equipment
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  );
}

/**
 * Normalize an entire exercise object
 */
export function normalizeExercise<
  T extends { muscles: string[]; equipment?: string },
>(exercise: T): T {
  return {
    ...exercise,
    muscles: normalizeMuscleGroups(exercise.muscles),
    equipment: normalizeEquipment(exercise.equipment),
  };
}

/**
 * Portuguese to English exercise name translations
 */
export const EXERCISE_TRANSLATIONS = {
  "agachamento no smith": "Smith Machine Squat",
  "cadeira extensora": "Leg Extension",
  "cadeira flexora": "Seated Leg Curl",
  "crucifixo máquina": "Chest Fly Machine",
  "desenvolvimento máquina": "Machine Shoulder Press",
  "elevação lateral": "Lateral Raises",
  "elevação lateral unilateral na polia média":
    "Cable Lateral Raises - Single Arm",
  "elevação lateral com halteres em pé": "Lateral Raises",
  "elevação pélvica máquina": "Hip Thrust Machine",
  "leg press horizontal": "Horizontal Leg Press",
  "levantamento terra": "Deadlift",
  "mesa flexora": "Lying Leg Curl",
  "panturrilha no leg press horizontal": "Leg Press Calf Raises",
  "puxada no pulley - pegada neutra aberta (barra romana)":
    "Lat Pulldown - Neutral Grip (Roman Bar)",
  "puxada no pulley - pegada pronada aberta":
    "Lat Pulldown - Wide Pronated Grip",
  "remada articulada unilateral - pegada neutra":
    "Single Arm Machine Row - Neutral Grip",
  "remada baixa - pegada pronada aberta":
    "Seated Cable Row - Wide Pronated Grip",
  "rosca direta com halteres sentado": "Incline Dumbbell Curls",
  "rosca scott máquina": "Preacher Curls",
  "supino inclinado com halteres": "Incline Dumbbell Press",
  "supino reto com halteres": "Dumbbell Bench Press",
  "tríceps na polia (corda)": "Cable Tricep Pushdown",
} as const;

/**
 * Translate Portuguese exercise name to English
 */
export function translateExerciseName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return (
    EXERCISE_TRANSLATIONS[normalized as keyof typeof EXERCISE_TRANSLATIONS] ||
    name
  );
}
