"use client";

import { useState } from "react";
import { templateRepository } from "@/lib/db/repositories";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, X } from "lucide-react";
import type { WorkoutSession, WorkoutTemplate } from "@/lib/types";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  session: WorkoutSession;
  onTemplateSaved?: (template: WorkoutTemplate) => void;
}

const CATEGORIES: { value: WorkoutTemplate["category"]; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "bodybuilding", label: "Bodybuilding" },
  { value: "endurance", label: "Endurance" },
  { value: "general", label: "General Fitness" },
  { value: "custom", label: "Custom" },
];

const DIFFICULTIES: { value: WorkoutTemplate["difficulty"]; label: string }[] =
  [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

const COMMON_TAGS = [
  "upper body",
  "lower body",
  "full body",
  "push",
  "pull",
  "legs",
  "compound",
  "isolation",
  "quick",
  "intense",
  "volume",
  "heavy",
];

export function SaveTemplateDialog({
  open,
  onClose,
  session,
  onTemplateSaved,
}: SaveTemplateDialogProps) {
  const { user } = useAppStore();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general" as WorkoutTemplate["category"],
    difficulty: "intermediate" as WorkoutTemplate["difficulty"],
    tags: [] as string[],
  });
  const [customTag, setCustomTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "general",
      difficulty: "intermediate",
      tags: [],
    });
    setCustomTag("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      handleAddTag(customTag.trim().toLowerCase());
      setCustomTag("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !user) return;

    setIsLoading(true);
    try {
      const template = await templateRepository.createTemplateFromSession(
        session,
        {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category,
          difficulty: formData.difficulty,
          tags: formData.tags,
        },
        user.id,
      );

      onTemplateSaved?.(template);
      handleClose();
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = formData.name.trim() && !isLoading;

  // Calculate summary stats
  const totalExercises = session.exercises.length;
  const totalSets = session.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.filter((set) => set.completedAt && !set.isWarmup).length,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5" />
            Save as Template
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Preview */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Workout Summary</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                {totalExercises} exercises, {totalSets} working sets
              </div>
              <div className="flex flex-wrap gap-1">
                {session.exercises.map((ex, i) => (
                  <span key={ex.id}>
                    {ex.nameAtTime}
                    {i < session.exercises.length - 1 && ","}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Push Day A, Upper Body Strength"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What makes this workout special? Any notes for future use..."
              rows={2}
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: WorkoutTemplate["category"]) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: WorkoutTemplate["difficulty"]) =>
                  setFormData({ ...formData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags ({formData.tags.length})</Label>

            {/* Selected tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Common tag buttons */}
            <div className="grid grid-cols-3 gap-1">
              {COMMON_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={formData.tags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    formData.tags.includes(tag)
                      ? handleRemoveTag(tag)
                      : handleAddTag(tag)
                  }
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Custom tag"
                className="text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomTag}
                disabled={!customTag.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2"
          >
            <BookmarkPlus className="h-4 w-4" />
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
