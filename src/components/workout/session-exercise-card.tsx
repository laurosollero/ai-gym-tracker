'use client';

import { useState, useEffect } from 'react';
import { sessionExerciseRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Timer } from 'lucide-react';
import type { SessionExercise, SetEntry } from '@/lib/types';
import { formatWeight } from '@/lib/utils/calculations';

interface SessionExerciseCardProps {
  sessionExercise: SessionExercise;
  sessionId: string;
  index: number;
}

export function SessionExerciseCard({
  sessionExercise,
  sessionId,
  index,
}: SessionExerciseCardProps) {
  const { user, currentSession, setCurrentSession, startRestTimer } = useAppStore();
  const [newSet, setNewSet] = useState<Partial<SetEntry>>({
    reps: undefined,
    weight: undefined,
  });
  const [isAddingSet, setIsAddingSet] = useState(false);

  const handleAddSet = async () => {
    if (!newSet.reps || !newSet.weight) return;

    setIsAddingSet(true);
    try {
      const setData: Omit<SetEntry, 'id'> = {
        index: sessionExercise.sets.length,
        reps: newSet.reps,
        weight: newSet.weight,
        restSec: user?.defaultRestSec,
        completedAt: new Date(),
      };

      await sessionExerciseRepository.addSetToExercise(sessionExercise.id, setData);

      // Update local state
      if (currentSession) {
        const updatedExercises = currentSession.exercises.map(ex =>
          ex.id === sessionExercise.id
            ? {
                ...ex,
                sets: [
                  ...ex.sets,
                  {
                    ...setData,
                    id: crypto.randomUUID(),
                  },
                ],
              }
            : ex
        );

        setCurrentSession({
          ...currentSession,
          exercises: updatedExercises,
        });
      }

      // Start rest timer if default rest time is set
      if (user?.defaultRestSec) {
        startRestTimer(user.defaultRestSec);
      }

      // Reset form
      setNewSet({ reps: undefined, weight: undefined });
    } catch (error) {
      console.error('Failed to add set:', error);
    } finally {
      setIsAddingSet(false);
    }
  };

  const handleCompleteSet = async (setId: string, setIndex: number) => {
    try {
      await sessionExerciseRepository.updateSet(sessionExercise.id, setId, {
        completedAt: new Date(),
      });

      // Update local state
      if (currentSession) {
        const updatedExercises = currentSession.exercises.map(ex =>
          ex.id === sessionExercise.id
            ? {
                ...ex,
                sets: ex.sets.map(set =>
                  set.id === setId
                    ? { ...set, completedAt: new Date() }
                    : set
                ),
              }
            : ex
        );

        setCurrentSession({
          ...currentSession,
          exercises: updatedExercises,
        });
      }

      // Start rest timer
      if (user?.defaultRestSec) {
        startRestTimer(user.defaultRestSec);
      }
    } catch (error) {
      console.error('Failed to complete set:', error);
    }
  };

  const completedSets = sessionExercise.sets.filter(set => set.completedAt).length;
  const totalVolume = sessionExercise.sets
    .filter(set => set.reps && set.weight && set.completedAt)
    .reduce((sum, set) => sum + (set.reps! * set.weight!), 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sessionExercise.nameAtTime}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {completedSets}/{sessionExercise.sets.length} sets
            </Badge>
            {totalVolume > 0 && (
              <Badge variant="outline">
                {formatWeight(totalVolume, user?.unitSystem || 'metric')} vol
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Existing Sets */}
        {sessionExercise.sets.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Sets</h4>
            {sessionExercise.sets.map((set, setIndex) => (
              <div
                key={set.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  set.completedAt ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-sm font-medium">{setIndex + 1}</span>
                  <span className="text-sm">
                    {set.weight && formatWeight(set.weight, user?.unitSystem || 'metric')}
                  </span>
                  <span className="text-sm">
                    {set.reps} reps
                  </span>
                  {set.rpe && (
                    <Badge variant="outline" className="text-xs">
                      RPE {set.rpe}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {set.completedAt ? (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Done
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteSet(set.id, setIndex)}
                      className="flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Set */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Add Set</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Weight"
                value={newSet.weight || ''}
                onChange={(e) =>
                  setNewSet({ ...newSet, weight: Number(e.target.value) || undefined })
                }
                min="0"
                step="0.25"
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Reps"
                value={newSet.reps || ''}
                onChange={(e) =>
                  setNewSet({ ...newSet, reps: Number(e.target.value) || undefined })
                }
                min="0"
                step="1"
              />
            </div>
            <Button
              onClick={handleAddSet}
              disabled={!newSet.reps || !newSet.weight || isAddingSet}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}