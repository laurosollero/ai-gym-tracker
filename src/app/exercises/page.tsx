"use client";

import { useState, useEffect } from "react";
import { exerciseRepository } from "@/lib/db/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Search,
  Dumbbell,
  Edit,
  Trash2,
  Download,
  Share2,
} from "lucide-react";
import { ExerciseInfoPopover } from "@/components/exercise/exercise-info-popover";
import { CustomExerciseDialog } from "@/components/workout/custom-exercise-dialog";
import { PromoteExerciseDialog } from "@/components/exercises/promote-exercise-dialog";
import type { Exercise } from "@/lib/types";
import Link from "next/link";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Glutes",
  "Core",
  "Cardio",
  "Full Body",
  "Olympic",
  "Powerlifting",
];

const EQUIPMENT_TYPES = [
  "All",
  "Barbell",
  "Dumbbell",
  "Cable",
  "Machine",
  "Bodyweight",
  "Resistance Band",
  "Kettlebell",
  "Smith Machine",
  "Other",
];

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [exerciseType, setExerciseType] = useState<
    "all" | "built-in" | "custom"
  >("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Load exercises
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const allExercises = await exerciseRepository.getAllExercises();
        setExercises(allExercises);
        setFilteredExercises(allExercises);
      } catch (error) {
        console.error("Failed to load exercises:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, []);

  // Filter exercises based on search and filters
  useEffect(() => {
    let filtered = exercises;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Muscle group filter
    if (selectedMuscle !== "All") {
      filtered = filtered.filter((exercise) =>
        exercise.muscles.some((muscle) =>
          muscle.toLowerCase().includes(selectedMuscle.toLowerCase()),
        ),
      );
    }

    // Equipment filter
    if (selectedEquipment !== "All") {
      filtered = filtered.filter((exercise) =>
        exercise.equipment
          ?.toLowerCase()
          .includes(selectedEquipment.toLowerCase()),
      );
    }

    // Exercise type filter
    if (exerciseType === "built-in") {
      filtered = filtered.filter((exercise) => !exercise.isCustom);
    } else if (exerciseType === "custom") {
      filtered = filtered.filter((exercise) => exercise.isCustom);
    }

    setFilteredExercises(filtered);
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment, exerciseType]);

  const handleDeleteExercise = async (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise?.isCustom) {
      alert("Cannot delete built-in exercises");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await exerciseRepository.deleteExercise(exerciseId);
      setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      alert("Failed to delete exercise. Please try again.");
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
  };

  const handleExerciseCreated = (newExercise: Exercise) => {
    setExercises((prev) => [newExercise, ...prev]);
    setShowCreateDialog(false);
  };

  const handleExerciseUpdated = (updatedExercise: Exercise) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === updatedExercise.id ? updatedExercise : e)),
    );
    setEditingExercise(null);
  };

  const exportExercises = (exercisesToExport: Exercise[], filename: string) => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalCount: exercisesToExport.length,
      exercises: exercisesToExport.map((exercise) => {
        // Create the exercise object with all fields
        const exerciseData: Record<string, unknown> = {
          id: exercise.id,
          name: exercise.name,
          muscles: exercise.muscles,
          equipment: exercise.equipment,
          instructions: exercise.instructions,
          videoUrl: exercise.videoUrl,
          gifUrl: exercise.gifUrl,
          imageUrl: exercise.imageUrl,
          notes: exercise.notes,
          isCustom: exercise.isCustom,
          ownerId: exercise.ownerId,
          createdAt: exercise.createdAt,
          updatedAt: exercise.updatedAt,
        };

        // Remove undefined values but keep null values to show they exist but are empty
        Object.keys(exerciseData).forEach((key) => {
          if (exerciseData[key] === undefined) {
            delete exerciseData[key];
          }
        });

        return exerciseData;
      }),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCustom = () => {
    const customExercises = exercises.filter((e) => e.isCustom);
    if (customExercises.length === 0) {
      alert("No custom exercises to export");
      return;
    }
    exportExercises(
      customExercises,
      `custom-exercises-${new Date().toISOString().split("T")[0]}.json`,
    );
  };

  const handleExportAll = () => {
    if (exercises.length === 0) {
      alert("No exercises to export");
      return;
    }
    exportExercises(
      exercises,
      `all-exercises-${new Date().toISOString().split("T")[0]}.json`,
    );
  };

  const handleExportFiltered = () => {
    if (filteredExercises.length === 0) {
      alert("No exercises match current filters");
      return;
    }
    exportExercises(
      filteredExercises,
      `filtered-exercises-${new Date().toISOString().split("T")[0]}.json`,
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const customExercisesCount = exercises.filter((e) => e.isCustom).length;
  const builtInExercisesCount = exercises.filter((e) => !e.isCustom).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8" />
                Exercise Library
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Browse and manage your exercise collection
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleExportCustom}
              disabled={customExercisesCount === 0}
              className="w-full sm:w-auto justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Custom
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Exercise
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{exercises.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{builtInExercisesCount}</div>
              <div className="text-xs text-muted-foreground">Built-in</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{customExercisesCount}</div>
              <div className="text-xs text-muted-foreground">Custom</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div>
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Muscle Groups" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((muscle) => (
                    <SelectItem key={muscle} value={muscle}>
                      {muscle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedEquipment}
                onValueChange={setSelectedEquipment}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Equipment" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleExportCustom}
                    disabled={customExercisesCount === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Custom Exercises ({customExercisesCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportAll}
                    disabled={exercises.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Exercises ({exercises.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportFiltered}
                    disabled={filteredExercises.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Filtered Results ({filteredExercises.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Type Selection */}
        <div className="mb-6">
          {/* Mobile: Dropdown selector */}
          <div className="sm:hidden">
            <Select value={exerciseType} onValueChange={(value) => setExerciseType(value as typeof exerciseType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Exercise type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exercises ({exercises.length})</SelectItem>
                <SelectItem value="built-in">Built-in ({builtInExercisesCount})</SelectItem>
                <SelectItem value="custom">Custom ({customExercisesCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Tabs */}
          <Tabs
            value={exerciseType}
            onValueChange={(value) => setExerciseType(value as typeof exerciseType)}
            className="hidden sm:block"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Exercises ({exercises.length})
              </TabsTrigger>
              <TabsTrigger value="built-in">
                Built-in ({builtInExercisesCount})
              </TabsTrigger>
              <TabsTrigger value="custom">
                Custom ({customExercisesCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Exercise Content */}
        <div>
            {/* Exercise Grid */}
            {filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map((exercise) => (
                  <Card
                    key={exercise.id}
                    className="group hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {exercise.name}
                            <ExerciseInfoPopover exercise={exercise} />
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            {exercise.equipment && (
                              <Badge variant="outline" className="text-xs">
                                {exercise.equipment}
                              </Badge>
                            )}
                            {exercise.isCustom && (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExercise(exercise)}
                            title={
                              exercise.isCustom
                                ? "Edit exercise"
                                : "Add media & notes"
                            }
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {exercise.isCustom && (
                            <>
                              <PromoteExerciseDialog
                                exercise={exercise}
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Promote to built-in exercise"
                                  >
                                    <Share2 className="h-3 w-3" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteExercise(exercise.id)
                                }
                                className="text-red-500 hover:text-red-700"
                                title="Delete exercise"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Target Muscles
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {exercise.muscles.map((muscle) => (
                              <Badge
                                key={muscle}
                                variant="secondary"
                                className="text-xs"
                              >
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {exercise.notes && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Notes
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {exercise.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No exercises found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ||
                    selectedMuscle !== "All" ||
                    selectedEquipment !== "All"
                      ? "Try adjusting your search or filters"
                      : "Create your first custom exercise to get started"}
                  </p>
                  {!searchQuery &&
                    selectedMuscle === "All" &&
                    selectedEquipment === "All" && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Exercise
                      </Button>
                    )}
                </CardContent>
              </Card>
            )}
        </div>

        {/* Create/Edit Exercise Dialog */}
        <CustomExerciseDialog
          open={showCreateDialog || !!editingExercise}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingExercise(null);
          }}
          onExerciseCreated={
            editingExercise ? handleExerciseUpdated : handleExerciseCreated
          }
          editingExercise={editingExercise}
        />
      </div>
    </div>
  );
}
