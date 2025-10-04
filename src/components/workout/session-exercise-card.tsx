'use client';

import { useState, useEffect } from 'react';
import { sessionExerciseRepository, personalRecordRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Timer, Trophy } from 'lucide-react';
import type { SessionExercise, SetEntry, PersonalRecord } from '@/lib/types';
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
  const [newPersonalRecords, setNewPersonalRecords] = useState<PersonalRecord[]>([]);

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

      // Find the completed set for PR checking
      const completedSet = sessionExercise.sets.find(set => set.id === setId);
      
      // Check for new personal records
      if (completedSet && completedSet.weight && completedSet.reps && user) {
        const newPRs = await personalRecordRepository.checkForNewRecord(
          user.id,
          sessionExercise.exerciseId,
          sessionExercise.nameAtTime,
          {
            weight: completedSet.weight,
            reps: completedSet.reps,
            sessionId: sessionId,
            setId: setId,
          }
        );
        
        if (newPRs.length > 0) {
          setNewPersonalRecords(prev => [...prev, ...newPRs]);
          // Auto-clear PR notifications after 5 seconds
          setTimeout(() => {
            setNewPersonalRecords(prev => prev.filter(pr => !newPRs.includes(pr)));
          }, 5000);
        }
      }

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

      {/* PR Notifications */}
      {newPersonalRecords.length > 0 && (
        <div className="px-6 pb-4">
          {newPersonalRecords.map((pr) => (
            <div
              key={pr.id}
              className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-2 animate-in slide-in-from-top"
            >
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                New {pr.recordType.replace('_', ' ').toUpperCase()} PR! 
                {pr.recordType === 'max_weight' && ` ${formatWeight(pr.value, user?.unitSystem || 'metric')} x ${pr.reps}`}
                {pr.recordType === 'max_reps' && ` ${pr.value} reps at ${formatWeight(pr.weight!, user?.unitSystem || 'metric')}`}
                {pr.recordType === 'max_volume' && ` ${formatWeight(pr.value, user?.unitSystem || 'metric')} volume`}
                {pr.recordType === 'best_estimated_1rm' && ` ${formatWeight(pr.value, user?.unitSystem || 'metric')} 1RM`}
              </span>
            </div>
          ))}
        </div>
      )}

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