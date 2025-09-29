'use client';

import { useState } from 'react';
import { exerciseRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import type { Exercise } from '@/lib/types';

interface CustomExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onExerciseCreated: (exercise: Exercise) => void;
}

const COMMON_MUSCLES = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio'
];

const COMMON_EQUIPMENT = [
  'Barbell', 'Dumbbells', 'Cable Machine', 'Machine', 'Bodyweight', 
  'Resistance Bands', 'Kettlebell', 'Smith Machine', 'Other'
];

export function CustomExerciseDialog({
  open,
  onClose,
  onExerciseCreated,
}: CustomExerciseDialogProps) {
  const { user } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    muscles: [] as string[],
    equipment: '',
    notes: '',
  });
  const [customMuscle, setCustomMuscle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      muscles: [],
      equipment: '',
      notes: '',
    });
    setCustomMuscle('');
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
      muscles: formData.muscles.filter(m => m !== muscle),
    });
  };

  const handleAddCustomMuscle = () => {
    if (customMuscle.trim()) {
      handleAddMuscle(customMuscle.trim());
      setCustomMuscle('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.muscles.length === 0) return;

    setIsLoading(true);
    try {
      const exerciseData: Omit<Exercise, 'createdAt' | 'updatedAt'> = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        muscles: formData.muscles,
        equipment: formData.equipment || undefined,
        isCustom: true,
        ownerId: user?.id,
        notes: formData.notes.trim() || undefined,
      };

      const exercise = await exerciseRepository.createExercise(exerciseData);
      onExerciseCreated(exercise);
      handleClose();
    } catch (error) {
      console.error('Failed to create exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.muscles.length > 0 && !isLoading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Exercise</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exercise Name */}
          <div className="space-y-2">
            <Label htmlFor="exerciseName">Exercise Name *</Label>
            <Input
              id="exerciseName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bulgarian Split Squats"
              required
            />
          </div>

          {/* Muscles */}
          <div className="space-y-2">
            <Label>Muscles Worked * ({formData.muscles.length})</Label>
            
            {/* Selected muscles */}
            {formData.muscles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.muscles.map((muscle) => (
                  <Badge key={muscle} variant="default" className="text-xs">
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
            <div className="grid grid-cols-3 gap-1">
              {COMMON_MUSCLES.map((muscle) => (
                <Button
                  key={muscle}
                  type="button"
                  variant={formData.muscles.includes(muscle) ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
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
                placeholder="Custom muscle group"
                className="text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
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
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment</Label>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {COMMON_EQUIPMENT.map((equipment) => (
                <Button
                  key={equipment}
                  type="button"
                  variant={formData.equipment === equipment ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => 
                    setFormData({ 
                      ...formData, 
                      equipment: formData.equipment === equipment ? '' : equipment 
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
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              placeholder="Or enter custom equipment"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Setup instructions, form cues, etc."
              rows={3}
            />
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
            <Plus className="h-4 w-4" />
            {isLoading ? 'Creating...' : 'Create Exercise'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}