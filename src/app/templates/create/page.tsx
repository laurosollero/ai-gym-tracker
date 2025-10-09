"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { templateRepository, exerciseRepository } from "@/lib/db/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Save,
  Eye,
  GripVertical,
} from "lucide-react";
import { ExerciseInfoPopover } from "@/components/exercise/exercise-info-popover";
import type {
  Exercise,
  WorkoutTemplate,
  TemplateExercise,
  TemplateSet,
} from "@/lib/types";
import Link from "next/link";

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "green" },
  { value: "intermediate", label: "Intermediate", color: "yellow" },
  { value: "advanced", label: "Advanced", color: "red" },
];

const TEMPLATE_CATEGORIES = [
  { value: "strength", label: "Strength" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "endurance", label: "Endurance" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "bodybuilding", label: "Bodybuilding" },
  { value: "general", label: "General Fitness" },
  { value: "custom", label: "Custom" },
];

function CreateTemplatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<WorkoutTemplate | null>(null);

  // Template data
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "",
    difficulty: "",
    estimatedDuration: 60,
    tags: [] as string[],
  });

  // Template exercises
  const [templateExercises, setTemplateExercises] = useState<
    TemplateExercise[]
  >([]);

  // Load exercises for search
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const allExercises = await exerciseRepository.getAllExercises();
        setExercises(allExercises);
      } catch (error) {
        console.error("Failed to load exercises:", error);
      }
    };

    loadExercises();
  }, []);

  // Load template for editing
  useEffect(() => {
    const editTemplateId = searchParams?.get("edit");
    if (!editTemplateId) return;

    const loadTemplate = async () => {
      try {
        const template =
          await templateRepository.getTemplateById(editTemplateId);
        if (template) {
          setEditingTemplate(template);
          setTemplateData({
            name: template.name,
            description: template.description || "",
            category: template.category,
            difficulty: template.difficulty,
            estimatedDuration: template.estimatedDuration,
            tags: template.tags,
          });
          setTemplateExercises(template.exercises);
        }
      } catch (error) {
        console.error("Failed to load template for editing:", error);
      }
    };

    loadTemplate();
  }, [searchParams]);

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddExercise = (exercise: Exercise) => {
    const newTemplateExercise: TemplateExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      orderIndex: templateExercises.length,
      sets: [
        {
          id: crypto.randomUUID(),
          index: 0,
          targetReps: 8,
          targetWeight: undefined,
          targetRPE: undefined,
          isWarmup: false,
          notes: "",
        },
      ],
      restSeconds: user?.defaultRestSec || 180,
      notes: "",
    };

    setTemplateExercises((prev) => [...prev, newTemplateExercise]);
    setShowExerciseSearch(false);
    setSearchQuery("");
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setTemplateExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleAddSet = (exerciseId: string) => {
    setTemplateExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          const newSet: TemplateSet = {
            id: crypto.randomUUID(),
            index: ex.sets.length,
            targetReps: 8,
            targetWeight: undefined,
            targetRPE: undefined,
            isWarmup: false,
            notes: "",
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      }),
    );
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setTemplateExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return { ...ex, sets: ex.sets.filter((set) => set.id !== setId) };
        }
        return ex;
      }),
    );
  };

  const handleSetChange = (
    exerciseId: string,
    setId: string,
    field: keyof TemplateSet,
    value: unknown,
  ) => {
    setTemplateExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === setId ? { ...set, [field]: value } : set,
            ),
          };
        }
        return ex;
      }),
    );
  };

  const handleExerciseChange = (
    exerciseId: string,
    field: keyof TemplateExercise,
    value: unknown,
  ) => {
    setTemplateExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, [field]: value } : ex)),
    );
  };

  const handleSaveTemplate = async () => {
    if (!templateData.name.trim() || templateExercises.length === 0) {
      alert("Please provide a template name and add at least one exercise.");
      return;
    }

    setIsLoading(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const updatedTemplate: Partial<WorkoutTemplate> = {
          name: templateData.name.trim(),
          description: templateData.description.trim() || undefined,
          category:
            (templateData.category as
              | "strength"
              | "hypertrophy"
              | "endurance"
              | "powerlifting"
              | "bodybuilding"
              | "general"
              | "custom") || "custom",
          difficulty:
            (templateData.difficulty as
              | "beginner"
              | "intermediate"
              | "advanced") || "intermediate",
          estimatedDuration: templateData.estimatedDuration,
          tags: templateData.tags,
          exercises: templateExercises,
        };

        await templateRepository.updateTemplate(
          editingTemplate.id,
          updatedTemplate,
        );
      } else {
        // Create new template
        const template: Omit<WorkoutTemplate, "createdAt" | "updatedAt"> = {
          id: crypto.randomUUID(),
          name: templateData.name.trim(),
          description: templateData.description.trim() || undefined,
          category:
            (templateData.category as
              | "strength"
              | "hypertrophy"
              | "endurance"
              | "powerlifting"
              | "bodybuilding"
              | "general"
              | "custom") || "custom",
          difficulty:
            (templateData.difficulty as
              | "beginner"
              | "intermediate"
              | "advanced") || "intermediate",
          estimatedDuration: templateData.estimatedDuration,
          tags: templateData.tags,
          exercises: templateExercises,
          isBuiltIn: false,
          ownerId: user?.id,
        };

        await templateRepository.createTemplate(template);
      }

      router.push("/templates");
    } catch (error) {
      console.error(
        `Failed to ${editingTemplate ? "update" : "save"} template:`,
        error,
      );
      alert(
        `Failed to ${editingTemplate ? "update" : "save"} template. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canSave =
    templateData.name.trim() && templateExercises.length > 0 && !isLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/templates">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {editingTemplate
                  ? "Edit Workout Template"
                  : "Create Workout Template"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {editingTemplate
                  ? "Modify your existing template"
                  : "Design a workout without performing it"}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" disabled className="w-full sm:w-auto">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!canSave} className="w-full sm:w-auto" size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isLoading
                ? editingTemplate
                  ? "Updating..."
                  : "Saving..."
                : editingTemplate
                  ? "Update Template"
                  : "Save Template"}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  Basic information about your workout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={templateData.name}
                    onChange={(e) =>
                      setTemplateData({ ...templateData, name: e.target.value })
                    }
                    placeholder="e.g., Push Pull Legs"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={templateData.description}
                    onChange={(e) =>
                      setTemplateData({
                        ...templateData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the workout program..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={templateData.category}
                    onValueChange={(value) =>
                      setTemplateData({ ...templateData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={templateData.difficulty}
                    onValueChange={(value) =>
                      setTemplateData({ ...templateData, difficulty: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={templateData.estimatedDuration}
                    onChange={(e) =>
                      setTemplateData({
                        ...templateData,
                        estimatedDuration: Number(e.target.value) || 60,
                      })
                    }
                    min="15"
                    max="300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Exercise */}
            <Card>
              <CardHeader>
                <CardTitle>Add Exercises</CardTitle>
                <CardDescription>
                  Search and add exercises to your template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowExerciseSearch(true)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowExerciseSearch(!showExerciseSearch)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {showExerciseSearch && (
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      {filteredExercises.length > 0 ? (
                        filteredExercises.slice(0, 10).map((exercise) => (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => handleAddExercise(exercise)}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{exercise.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {exercise.muscles.join(", ")}
                              </div>
                            </div>
                            <Plus className="h-4 w-4" />
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-muted-foreground">
                          No exercises found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Exercises */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Template Exercises ({templateExercises.length})
                </CardTitle>
                <CardDescription>
                  Configure exercises, sets, and target numbers for your
                  template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templateExercises.length === 0 ? (
                  <div className="text-center py-12">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No exercises added
                    </h3>
                    <p className="text-muted-foreground">
                      Search and add exercises to start building your template
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {templateExercises.map(
                      (templateExercise, exerciseIndex) => {
                        const exercise = exercises.find(
                          (e) => e.id === templateExercise.exerciseId,
                        );

                        return (
                          <Card
                            key={templateExercise.id}
                            className="border-l-4 border-l-primary"
                          >
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      #{exerciseIndex + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg">
                                        {templateExercise.exerciseName}
                                      </CardTitle>
                                      {exercise && (
                                        <ExerciseInfoPopover
                                          exercise={exercise}
                                        />
                                      )}
                                    </div>
                                    {exercise && (
                                      <div className="flex gap-1 mt-1">
                                        {exercise.muscles
                                          .slice(0, 3)
                                          .map((muscle) => (
                                            <Badge
                                              key={muscle}
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {muscle}
                                            </Badge>
                                          ))}
                                        {exercise.muscles.length > 3 && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            +{exercise.muscles.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveExercise(templateExercise.id)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Exercise Settings */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Rest Time (seconds)</Label>
                                  <Input
                                    type="number"
                                    value={templateExercise.restSeconds}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        templateExercise.id,
                                        "restSeconds",
                                        Number(e.target.value) || 0,
                                      )
                                    }
                                    min="0"
                                    max="600"
                                  />
                                </div>
                                <div>
                                  <Label>Exercise Notes</Label>
                                  <Input
                                    value={templateExercise.notes}
                                    onChange={(e) =>
                                      handleExerciseChange(
                                        templateExercise.id,
                                        "notes",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Form cues, tempo, etc."
                                  />
                                </div>
                              </div>

                              {/* Sets */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <Label>
                                    Sets ({templateExercise.sets.length})
                                  </Label>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleAddSet(templateExercise.id)
                                    }
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Set
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {templateExercise.sets.map(
                                    (set, setIndex) => (
                                      <div
                                        key={set.id}
                                        className="flex items-center gap-2 p-3 border rounded-lg"
                                      >
                                        <span className="w-8 text-sm font-medium">
                                          #{setIndex + 1}
                                        </span>

                                        <div className="flex-1 grid grid-cols-4 gap-2">
                                          <div>
                                            <Label className="text-xs">
                                              Reps
                                            </Label>
                                            <Input
                                              type="number"
                                              value={set.targetReps || ""}
                                              onChange={(e) =>
                                                handleSetChange(
                                                  templateExercise.id,
                                                  set.id,
                                                  "targetReps",
                                                  Number(e.target.value) ||
                                                    undefined,
                                                )
                                              }
                                              placeholder="8"
                                              min="1"
                                              className="h-8"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs">
                                              Weight
                                            </Label>
                                            <Input
                                              type="number"
                                              value={set.targetWeight || ""}
                                              onChange={(e) =>
                                                handleSetChange(
                                                  templateExercise.id,
                                                  set.id,
                                                  "targetWeight",
                                                  Number(e.target.value) ||
                                                    undefined,
                                                )
                                              }
                                              placeholder="100"
                                              step="0.25"
                                              className="h-8"
                                            />
                                          </div>

                                          <div>
                                            <Label className="text-xs">
                                              RPE
                                            </Label>
                                            <Input
                                              type="number"
                                              value={set.targetRPE || ""}
                                              onChange={(e) =>
                                                handleSetChange(
                                                  templateExercise.id,
                                                  set.id,
                                                  "targetRPE",
                                                  Number(e.target.value) ||
                                                    undefined,
                                                )
                                              }
                                              placeholder="8"
                                              min="1"
                                              max="10"
                                              step="0.5"
                                              className="h-8"
                                            />
                                          </div>

                                          <div className="flex items-end gap-1">
                                            <label className="flex items-center gap-1 text-xs">
                                              <input
                                                type="checkbox"
                                                checked={set.isWarmup}
                                                onChange={(e) =>
                                                  handleSetChange(
                                                    templateExercise.id,
                                                    set.id,
                                                    "isWarmup",
                                                    e.target.checked,
                                                  )
                                                }
                                                className="rounded"
                                              />
                                              Warmup
                                            </label>
                                          </div>
                                        </div>

                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveSet(
                                              templateExercise.id,
                                              set.id,
                                            )
                                          }
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      },
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <CreateTemplatePageContent />
    </Suspense>
  );
}
