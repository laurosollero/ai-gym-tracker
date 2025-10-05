'use client';

import { useState, useEffect } from 'react';
import { exerciseRepository, sessionExerciseRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomExerciseDialog } from './custom-exercise-dialog';
import { Search, Dumbbell, Plus } from 'lucide-react';
import type { Exercise } from '@/lib/types';

interface ExerciseSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string, exerciseName: string) => void;
  sessionId: string;
}

export function ExerciseSelector({
  open,
  onClose,
  onSelectExercise,
  sessionId,
}: ExerciseSelectorProps) {
  const { currentSession, setCurrentSession } = useAppStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const allExercises = await exerciseRepository.getAllExercises();
        setExercises(allExercises);
        setFilteredExercises(allExercises);
      } catch (error) {
        console.error('Failed to load exercises:', error);
      }
    };

    if (open) {
      loadExercises();
    }
  }, [open]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscles.some(muscle => 
          muscle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  const handleSelectExercise = async (exercise: Exercise) => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const orderIndex = currentSession.exercises.length;
      
      const sessionExercise = await sessionExerciseRepository.addExerciseToSession(
        sessionId,
        exercise.id,
        exercise.name,
        orderIndex
      );

      // Update current session in store
      const updatedSession = {
        ...currentSession,
        exercises: [...currentSession.exercises, sessionExercise],
      };
      setCurrentSession(updatedSession);

      onSelectExercise(exercise.id, exercise.name);
      onClose();
    } catch (error) {
      console.error('Failed to add exercise to session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomExerciseCreated = (exercise: Exercise) => {
    setExercises(prev => [...prev, exercise]);
    setFilteredExercises(prev => [...prev, exercise]);
    handleSelectExercise(exercise);
  };

  const groupedExercises = filteredExercises.reduce((groups, exercise) => {
    const primaryMuscle = exercise.muscles[0] || 'Other';
    if (!groups[primaryMuscle]) {
      groups[primaryMuscle] = [];
    }
    groups[primaryMuscle].push(exercise);
    return groups;
  }, {} as Record<string, Exercise[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Select Exercise
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Create Custom Exercise Button */}
        <Button
          onClick={() => setShowCustomDialog(true)}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Custom Exercise
        </Button>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
            <div key={muscleGroup}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {muscleGroup}
              </h3>
              <div className="grid gap-2">
                {exercises.map((exercise) => (
                  <Button
                    key={exercise.id}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={() => handleSelectExercise(exercise)}
                    disabled={isLoading}
                  >
                    <div className="flex flex-col items-start w-full">
                      <div className="font-medium">{exercise.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.muscles.map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                        {exercise.equipment && (
                          <Badge variant="outline" className="text-xs">
                            {exercise.equipment}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {filteredExercises.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">
                {searchQuery ? 'No exercises found matching your search.' : 'No exercises available.'}
              </p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or create a custom exercise below.
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCustomDialog(true)}
              >
                Create Custom Exercise
              </Button>
            </div>
          )}
        </div>

        {/* Custom Exercise Dialog */}
        <CustomExerciseDialog
          open={showCustomDialog}
          onClose={() => setShowCustomDialog(false)}
          onExerciseCreated={handleCustomExerciseCreated}
        />
      </DialogContent>
    </Dialog>
  );
}