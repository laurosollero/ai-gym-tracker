"use client";

import { useState, useEffect } from "react";
import { exerciseRepository } from "@/lib/db/repositories";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import type { Exercise } from "@/lib/types";

interface CustomExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
  editingExercise?: Exercise | null;
}

const COMMON_MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Cardio",
];

const COMMON_EQUIPMENT = [
  "Barbell",
  "Dumbbells",
  "Cable Machine",
  "Machine",
  "Bodyweight",
  "Resistance Bands",
  "Kettlebell",
  "Smith Machine",
  "Other",
];

export function CustomExerciseDialog({
  open,
  onClose,
  onExerciseCreated,
  editingExercise,
}: CustomExerciseDialogProps) {
  const { user } = useAppStore();
  const [formData, setFormData] = useState({
    name: "",
    muscles: [] as string[],
    equipment: "",
    notes: "",
    instructions: "",
    videoUrl: "",
    gifUrl: "",
    imageUrl: "",
  });
  const [customMuscle, setCustomMuscle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingExercise) {
      setFormData({
        name: editingExercise.name,
        muscles: [...editingExercise.muscles],
        equipment: editingExercise.equipment || "",
        notes: editingExercise.notes || "",
        instructions: editingExercise.instructions || "",
        videoUrl: editingExercise.videoUrl || "",
        gifUrl: editingExercise.gifUrl || "",
        imageUrl: editingExercise.imageUrl || "",
      });
    } else {
      resetForm();
    }
  }, [editingExercise]);

  const resetForm = () => {
    setFormData({
      name: "",
      muscles: [],
      equipment: "",
      notes: "",
      instructions: "",
      videoUrl: "",
      gifUrl: "",
      imageUrl: "",
    });
    setCustomMuscle("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddMuscle = (muscle: string) => {
    if (muscle && !formData.muscles.includes(muscle)) {
      setFormData({
        ...formData,
        muscles: [...formData.muscles, muscle],
      });
    }
  };

  const handleRemoveMuscle = (muscle: string) => {
    setFormData({
      ...formData,
      muscles: formData.muscles.filter((m) => m !== muscle),
    });
  };

  const handleAddCustomMuscle = () => {
    if (customMuscle.trim()) {
      handleAddMuscle(customMuscle.trim());
      setCustomMuscle("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.muscles.length === 0) return;

    setIsLoading(true);
    try {
      if (editingExercise) {
        // Update existing exercise
        const updatedData: Partial<Exercise> = {};

        // For custom exercises, allow all changes
        if (editingExercise.isCustom) {
          updatedData.name = formData.name.trim();
          updatedData.muscles = formData.muscles;
          updatedData.equipment = formData.equipment || undefined;
        }

        // For all exercises (built-in and custom), allow media and notes
        updatedData.notes = formData.notes.trim() || undefined;
        updatedData.instructions = formData.instructions.trim() || undefined;
        updatedData.videoUrl = formData.videoUrl.trim() || undefined;
        updatedData.gifUrl = formData.gifUrl.trim() || undefined;
        updatedData.imageUrl = formData.imageUrl.trim() || undefined;

        const exercise = await exerciseRepository.updateExercise(
          editingExercise.id,
          updatedData,
        );
        onExerciseCreated(exercise);
      } else {
        // Create new exercise
        const exerciseData: Omit<Exercise, "createdAt" | "updatedAt"> = {
          id: crypto.randomUUID(),
          name: formData.name.trim(),
          muscles: formData.muscles,
          equipment: formData.equipment || undefined,
          isCustom: true,
          ownerId: user?.id,
          notes: formData.notes.trim() || undefined,
          instructions: formData.instructions.trim() || undefined,
          videoUrl: formData.videoUrl.trim() || undefined,
          gifUrl: formData.gifUrl.trim() || undefined,
          imageUrl: formData.imageUrl.trim() || undefined,
        };

        const exercise = await exerciseRepository.createExercise(exerciseData);
        onExerciseCreated(exercise);
      }

      handleClose();
    } catch (error) {
      console.error(
        `Failed to ${editingExercise ? "update" : "create"} exercise:`,
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    formData.name.trim() && formData.muscles.length > 0 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {editingExercise
              ? editingExercise.isCustom
                ? "Edit Custom Exercise"
                : "Add Media & Notes"
              : "Create Custom Exercise"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Exercise Name */}
          <div className="space-y-1.5">
            <Label htmlFor="exerciseName" className="text-sm font-medium">Exercise Name *</Label>
            <Input
              id="exerciseName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Bulgarian Split Squats"
              required
              disabled={!!editingExercise && !editingExercise.isCustom}
              className="text-sm"
            />
            {editingExercise && !editingExercise.isCustom && (
              <p className="text-xs text-muted-foreground">
                Built-in exercise name cannot be changed
              </p>
            )}
          </div>

          {/* Muscles */}
          {(!editingExercise || editingExercise.isCustom) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Muscles Worked * ({formData.muscles.length})</Label>

              {/* Selected muscles */}
              {formData.muscles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.muscles.map((muscle) => (
                    <Badge key={muscle} variant="default" className="text-xs h-6">
                      {muscle}
                      <button
                        type="button"
                        onClick={() => handleRemoveMuscle(muscle)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Common muscle buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {COMMON_MUSCLES.map((muscle) => (
                  <Button
                    key={muscle}
                    type="button"
                    variant={
                      formData.muscles.includes(muscle) ? "default" : "outline"
                    }
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() =>
                      formData.muscles.includes(muscle)
                        ? handleRemoveMuscle(muscle)
                        : handleAddMuscle(muscle)
                    }
                  >
                    {muscle}
                  </Button>
                ))}
              </div>

              {/* Custom muscle input */}
              <div className="flex gap-2">
                <Input
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  placeholder="Custom muscle"
                  className="text-sm h-8"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomMuscle();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomMuscle}
                  disabled={!customMuscle.trim()}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Show muscles for built-in exercises (read-only) */}
          {editingExercise && !editingExercise.isCustom && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Muscles Worked</Label>
              <div className="flex flex-wrap gap-1">
                {formData.muscles.map((muscle) => (
                  <Badge key={muscle} variant="secondary" className="text-xs h-6">
                    {muscle}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Built-in exercise muscles cannot be changed
              </p>
            </div>
          )}

          {/* Equipment */}
          {(!editingExercise || editingExercise.isCustom) && (
            <div className="space-y-2">
              <Label htmlFor="equipment" className="text-sm font-medium">Equipment</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-2">
                {COMMON_EQUIPMENT.map((equipment) => (
                  <Button
                    key={equipment}
                    type="button"
                    variant={
                      formData.equipment === equipment ? "default" : "outline"
                    }
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        equipment:
                          formData.equipment === equipment ? "" : equipment,
                      })
                    }
                  >
                    {equipment}
                  </Button>
                ))}
              </div>
              <Input
                id="equipment"
                value={formData.equipment}
                onChange={(e) =>
                  setFormData({ ...formData, equipment: e.target.value })
                }
                placeholder="Or enter custom equipment"
                className="text-sm h-8"
              />
            </div>
          )}

          {/* Show equipment for built-in exercises (read-only) */}
          {editingExercise &&
            !editingExercise.isCustom &&
            formData.equipment && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Equipment</Label>
                <Badge variant="secondary" className="text-sm h-6">
                  {formData.equipment}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Built-in exercise equipment cannot be changed
                </p>
              </div>
            )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Setup instructions, form cues, etc."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="instructions" className="text-sm font-medium">
              Detailed Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder="Step-by-step exercise instructions..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Media URLs - Collapsible on mobile */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Exercise Media (Optional)</Label>
            <div className="space-y-1.5">
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                placeholder="Video URL (YouTube, etc.)"
                type="url"
                className="text-sm h-8"
              />
              <Input
                id="gifUrl"
                value={formData.gifUrl}
                onChange={(e) =>
                  setFormData({ ...formData, gifUrl: e.target.value })
                }
                placeholder="GIF URL"
                type="url"
                className="text-sm h-8"
              />
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="Image URL"
                type="url"
                className="text-sm h-8"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
          >
            <Plus className="h-4 w-4" />
            {isLoading
              ? editingExercise
                ? "Updating..."
                : "Creating..."
              : editingExercise
                ? "Update Exercise"
                : "Create Exercise"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
