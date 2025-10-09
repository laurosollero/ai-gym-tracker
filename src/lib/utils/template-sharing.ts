import type { WorkoutTemplate, TemplateExercise, Exercise } from "@/lib/types";
import { exerciseRepository } from "@/lib/db/repositories";

export interface TemplateShareData {
  template: Omit<WorkoutTemplate, "id" | "ownerId" | "createdAt" | "updatedAt">;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    muscles: string[];
    equipment?: string;
  }>;
  exportedAt: string;
  exportedBy: string;
  version: string;
}

/**
 * Compress and encode template data for URL sharing with size optimization
 */
export function encodeTemplateForUrl(templateData: TemplateShareData): string {
  try {
    // Helper function to remove null/undefined values
    const cleanObject = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj
          .map(cleanObject)
          .filter((item) => item !== null && item !== undefined);
      }
      if (obj && typeof obj === "object") {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined && value !== "") {
            cleaned[key] = cleanObject(value);
          }
        }
        return cleaned;
      }
      return obj;
    };

    // Create a more compact representation
    const compact = cleanObject({
      n: templateData.template.name,
      d: templateData.template.description,
      c: templateData.template.category,
      df: templateData.template.difficulty,
      dur: templateData.template.estimatedDuration,
      e: templateData.template.exercises.map((ex) => ({
        id: ex.exerciseId,
        n: ex.exerciseName,
        o: ex.orderIndex,
        r: ex.restSeconds,
        s: ex.sets.map((set) => ({
          i: set.index,
          tr: set.targetReps,
          tw: set.targetWeight,
          trpe: set.targetRPE,
          w: set.isWarmup ? 1 : undefined,
          n: set.notes,
        })),
      })),
      t: templateData.template.tags,
      ex: templateData.exercises.map((ex) => ({
        id: ex.exerciseId,
        n: ex.exerciseName,
        m: ex.muscles,
        eq: ex.equipment,
      })),
      ea: templateData.exportedAt,
      eb: templateData.exportedBy,
      v: templateData.version,
    });

    // Convert to JSON and compress using base64
    const json = JSON.stringify(compact);
    const compressed = btoa(encodeURIComponent(json));
    return compressed;
  } catch (error) {
    console.error("Failed to encode template for URL:", error);
    throw new Error("Failed to encode template for sharing");
  }
}

/**
 * Decode and decompress template data from URL
 */
export function decodeTemplateFromUrl(encodedData: string): TemplateShareData {
  try {
    const decompressed = decodeURIComponent(atob(encodedData));
    const data = JSON.parse(decompressed);

    // Check if it's the new compact format
    if (data.n && data.v) {
      // Convert compact format back to full format
      return {
        template: {
          name: data.n,
          description: data.d,
          category: data.c,
          difficulty: data.df,
          estimatedDuration: data.dur,
          exercises: data.e.map(
            (ex: {
              id: string;
              n: string;
              o: number;
              r: number;
              s: Array<{
                i: number;
                tr?: number;
                tw?: number;
                trpe?: number;
                w?: number;
                n?: string;
              }>;
            }) => ({
              id: crypto.randomUUID(),
              exerciseId: ex.id,
              exerciseName: ex.n,
              orderIndex: ex.o,
              restSeconds: ex.r,
              sets: ex.s.map((set) => ({
                id: crypto.randomUUID(),
                index: set.i,
                targetReps: set.tr,
                targetWeight: set.tw,
                targetRPE: set.trpe,
                isWarmup: set.w === 1,
                notes: set.n,
              })),
            }),
          ),
          tags: data.t,
          isBuiltIn: false,
          createdFromSessionId: undefined,
        },
        exercises: data.ex.map(
          (ex: { id: string; n: string; m: string[]; eq?: string }) => ({
            exerciseId: ex.id,
            exerciseName: ex.n,
            muscles: ex.m,
            equipment: ex.eq,
          }),
        ),
        exportedAt: data.ea,
        exportedBy: data.eb,
        version: data.v,
      };
    } else {
      // Legacy format - validate the decoded data
      if (!data.template || !data.version) {
        throw new Error("Invalid template data format");
      }
      return data;
    }
  } catch (error) {
    console.error("Failed to decode template from URL:", error);
    throw new Error("Invalid sharing link");
  }
}

/**
 * Generate a shareable URL for a template
 */
export function generateTemplateShareUrl(
  templateData: TemplateShareData,
): string {
  const encodedData = encodeTemplateForUrl(templateData);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const basePath =
    process.env.NODE_ENV === "production" ? "/ai-gym-tracker" : "";
  return `${baseUrl}${basePath}/templates/share?data=${encodedData}`;
}

/**
 * Prepare template data for sharing
 */
export async function prepareTemplateForSharing(
  template: WorkoutTemplate,
  exportedBy: string,
): Promise<TemplateShareData> {
  // Get exercise details for all exercises in the template
  const exerciseDetails: Array<{
    exerciseId: string;
    exerciseName: string;
    muscles: string[];
    equipment?: string;
  }> = [];

  for (const templateExercise of template.exercises) {
    try {
      const exercise = await exerciseRepository.getExerciseById(
        templateExercise.exerciseId,
      );
      if (exercise) {
        exerciseDetails.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscles: exercise.muscles,
          equipment: exercise.equipment,
        });
      } else {
        // Fallback to template exercise name if exercise not found
        exerciseDetails.push({
          exerciseId: templateExercise.exerciseId,
          exerciseName: templateExercise.exerciseName,
          muscles: [],
          equipment: undefined,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to load exercise ${templateExercise.exerciseId}:`,
        error,
      );
      exerciseDetails.push({
        exerciseId: templateExercise.exerciseId,
        exerciseName: templateExercise.exerciseName,
        muscles: [],
        equipment: undefined,
      });
    }
  }

  return {
    template: {
      name: template.name,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      estimatedDuration: template.estimatedDuration,
      exercises: template.exercises,
      tags: template.tags,
      isBuiltIn: false,
      createdFromSessionId: template.createdFromSessionId,
    },
    exercises: exerciseDetails,
    exportedAt: new Date().toISOString(),
    exportedBy,
    version: "1.0.0",
  };
}

/**
 * Import template from share data
 */
export async function importTemplateFromShareData(
  shareData: TemplateShareData,
  userId: string,
): Promise<WorkoutTemplate> {
  // Import the template using the same logic as file import
  const { exerciseRepository, templateRepository } = await import(
    "@/lib/db/repositories"
  );

  // Create exercises that don't exist
  const exerciseMap = new Map<string, string>(); // old ID -> new ID

  for (const exportedExercise of shareData.exercises || []) {
    try {
      // Try to find existing exercise by name
      const searchResults = await exerciseRepository.searchExercises(
        exportedExercise.exerciseName,
      );
      const existingExercise = searchResults.find(
        (ex) =>
          ex.name.toLowerCase() === exportedExercise.exerciseName.toLowerCase(),
      );

      if (existingExercise) {
        exerciseMap.set(exportedExercise.exerciseId, existingExercise.id);
      } else {
        // Create new exercise
        const newExercise: Omit<Exercise, "createdAt" | "updatedAt"> = {
          id: crypto.randomUUID(),
          name: exportedExercise.exerciseName,
          muscles: exportedExercise.muscles || [],
          equipment: exportedExercise.equipment,
          isCustom: true,
          ownerId: userId,
          notes: "Imported with shared template",
        };

        const createdExercise =
          await exerciseRepository.createExercise(newExercise);
        exerciseMap.set(exportedExercise.exerciseId, createdExercise.id);
      }
    } catch (error) {
      console.warn(
        `Failed to process exercise ${exportedExercise.exerciseName}:`,
        error,
      );
    }
  }

  // Update exercise references in template
  const updatedExercises: TemplateExercise[] = shareData.template.exercises.map(
    (exercise: TemplateExercise) => ({
      ...exercise,
      id: crypto.randomUUID(),
      exerciseId: exerciseMap.get(exercise.exerciseId) || exercise.exerciseId,
      sets: exercise.sets.map((set) => ({
        ...set,
        id: crypto.randomUUID(),
      })),
    }),
  );

  // Create template with unique name
  let templateName = shareData.template.name;
  const allTemplates = await templateRepository.getAllTemplates();
  const existingTemplate = allTemplates.find(
    (t) => t.name === templateName && t.ownerId === userId,
  );

  if (existingTemplate) {
    templateName = `${templateName} (Shared)`;
    let counter = 1;
    while (
      allTemplates.find((t) => t.name === templateName && t.ownerId === userId)
    ) {
      templateName = `${shareData.template.name} (Shared ${counter})`;
      counter++;
    }
  }

  const newTemplate: Omit<WorkoutTemplate, "createdAt" | "updatedAt"> = {
    id: crypto.randomUUID(),
    name: templateName,
    description: shareData.template.description || "Shared template",
    category: shareData.template.category || "custom",
    difficulty: shareData.template.difficulty || "intermediate",
    estimatedDuration: shareData.template.estimatedDuration || 60,
    exercises: updatedExercises,
    tags: shareData.template.tags || [],
    isBuiltIn: false,
    ownerId: userId,
    createdFromSessionId: undefined,
  };

  return await templateRepository.createTemplate(newTemplate);
}
