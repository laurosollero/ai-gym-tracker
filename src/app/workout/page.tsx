'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { sessionRepository, sessionExerciseRepository, templateRepository, exerciseRepository } from '@/lib/db/repositories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseSelector } from '@/components/workout/exercise-selector';
import { SessionExerciseCard } from '@/components/workout/session-exercise-card';
import { RestTimer } from '@/components/workout/rest-timer';
import { ArrowLeft, Plus, Save, FileText, BookOpen } from 'lucide-react';
import type { WorkoutSession, WorkoutTemplate, Exercise } from '@/lib/types';
import Link from 'next/link';

function WorkoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, currentSession, setCurrentSession, setSessionActive } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<Map<string, Exercise>>(new Map());
  
  const templateId = searchParams?.get('template');

  // Load template if specified
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return;
      
      try {
        const loadedTemplate = await templateRepository.getTemplateById(templateId);
        setTemplate(loadedTemplate || null);
      } catch (error) {
        console.error('Failed to load template:', error);
      }
    };

    loadTemplate();
  }, [templateId]);

  // Initialize session if none exists
  useEffect(() => {
    const initSession = async () => {
      if (!user || currentSession) return;

      setIsLoading(true);
      try {
        const newSession: Omit<WorkoutSession, 'createdAt' | 'updatedAt'> = {
          id: crypto.randomUUID(),
          userId: user.id,
          date: new Date().toISOString().split('T')[0],
          startedAt: new Date(),
          exercises: [],
        };

        const session = await sessionRepository.createSession(newSession);
        
        // If we have a template, add its exercises to the session
        if (template) {
          for (const templateExercise of template.exercises) {
            const sessionExercise = await sessionExerciseRepository.addExerciseToSession(
              session.id,
              templateExercise.exerciseId,
              templateExercise.exerciseName,
              templateExercise.orderIndex
            );

            // Add template sets as incomplete sets
            for (const templateSet of templateExercise.sets) {
              await sessionExerciseRepository.addSetToExercise(sessionExercise.id, {
                index: templateSet.index,
                reps: templateSet.targetReps,
                weight: templateSet.targetWeight,
                rpe: templateSet.targetRPE,
                isWarmup: templateSet.isWarmup,
                notes: templateSet.notes,
                restSec: templateExercise.restSeconds,
              });
            }
          }
          
          // Reload session with exercises
          const updatedSession = await sessionRepository.getSessionById(session.id);
          setCurrentSession(updatedSession || session);
        } else {
          setCurrentSession(session);
        }
        
        setSessionActive(true);
      } catch (error) {
        console.error('Failed to create session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only init session after template is loaded (or confirmed not loading)
    if (templateId ? template !== null : true) {
      initSession();
    }
  }, [user, currentSession, setCurrentSession, setSessionActive, template, templateId]);

  // Load exercise data for the session
  useEffect(() => {
    const loadExercises = async () => {
      if (!currentSession || currentSession.exercises.length === 0) return;

      try {
        const exerciseMap = new Map<string, Exercise>();
        
        for (const sessionExercise of currentSession.exercises) {
          const exercise = await exerciseRepository.getExerciseById(sessionExercise.exerciseId);
          if (exercise) {
            exerciseMap.set(sessionExercise.exerciseId, exercise);
          }
        }
        
        setExercises(exerciseMap);
      } catch (error) {
        console.error('Failed to load exercises:', error);
      }
    };

    loadExercises();
  }, [currentSession]);

  const handleFinishWorkout = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      if (sessionNotes.trim()) {
        await sessionRepository.updateSession(currentSession.id, {
          notes: sessionNotes.trim(),
        });
      }
      await sessionRepository.finishSession(currentSession.id);
      setCurrentSession(null);
      setSessionActive(false);
      router.push(`/workout/review/${currentSession.id}`);
    } catch (error) {
      console.error('Failed to finish session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercise = () => {
    setShowExerciseSelector(false);
  };

  if (isLoading && !currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Unable to create workout session. Please try again.
            </p>
            <Button asChild className="w-full mt-4">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionDuration = currentSession.startedAt 
    ? Math.floor((Date.now() - currentSession.startedAt.getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Workout Session</h1>
                {template && <BookOpen className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Duration: {sessionDuration} minutes
                </p>
                {template && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    From template: {template.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button 
            onClick={handleFinishWorkout} 
            disabled={isLoading || currentSession.exercises.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Finish Workout
          </Button>
        </header>

        {/* Rest Timer */}
        <RestTimer />

        {/* Exercises */}
        <div className="space-y-4 mb-6">
          {currentSession.exercises.map((sessionExercise, index) => (
            <SessionExerciseCard
              key={sessionExercise.id}
              sessionExercise={sessionExercise}
              sessionId={currentSession.id}
              index={index}
              exercise={exercises.get(sessionExercise.exerciseId)}
            />
          ))}
        </div>

        {/* Session Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Session Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="How did this workout feel? Any observations, achievements, or adjustments for next time..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Add Exercise Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={() => setShowExerciseSelector(true)}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </CardContent>
        </Card>

        {/* Exercise Selector Dialog */}
        <ExerciseSelector
          open={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          onSelectExercise={handleAddExercise}
          sessionId={currentSession.id}
        />
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <WorkoutPageContent />
    </Suspense>
  );
}