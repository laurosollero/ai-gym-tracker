'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionRepository, userRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SaveTemplateDialog } from '@/components/templates/save-template-dialog';
import { CheckCircle2, Clock, Dumbbell, Home, History, BookmarkPlus } from 'lucide-react';
import { calculateSessionSummary, formatWeight, formatDuration } from '@/lib/utils/calculations';
import type { WorkoutSession, SessionSummary } from '@/lib/types';
import Link from 'next/link';

export default function SessionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAppStore();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionId = params.id as string;
        const loadedSession = await sessionRepository.getSessionById(sessionId);
        
        if (loadedSession) {
          setSession(loadedSession);
          setSummary(calculateSessionSummary(loadedSession));
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Session not found.
            </p>
            <Button asChild className="w-full mt-4">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-6">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
          <p className="text-muted-foreground">
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {formatDuration(summary.duration)}
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Dumbbell className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{summary.exerciseCount}</div>
              <div className="text-xs text-muted-foreground">Exercises</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-500">{summary.totalSets}</div>
              <div className="text-xs text-muted-foreground">Total Sets</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-orange-500">
                {formatWeight(summary.totalVolume, user?.unitSystem || 'metric')}
              </div>
              <div className="text-xs text-muted-foreground">Volume</div>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Exercise Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.exercises.map((exercise, index) => {
              const completedSets = exercise.sets.filter(set => set.completedAt).length;
              const exerciseVolume = exercise.sets
                .filter(set => set.reps && set.weight && set.completedAt)
                .reduce((sum, set) => sum + (set.reps! * set.weight!), 0);

              return (
                <div key={exercise.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{exercise.nameAtTime}</h3>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {completedSets} sets
                      </Badge>
                      {exerciseVolume > 0 && (
                        <Badge variant="outline">
                          {formatWeight(exerciseVolume, user?.unitSystem || 'metric')} vol
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {exercise.sets
                      .filter(set => set.completedAt)
                      .map((set, setIndex) => (
                        <div key={set.id} className="flex items-center gap-4 text-sm">
                          <span className="w-12 text-muted-foreground">
                            Set {setIndex + 1}
                          </span>
                          <span className="font-medium">
                            {set.weight && formatWeight(set.weight, user?.unitSystem || 'metric')}
                          </span>
                          <span>×</span>
                          <span>{set.reps} reps</span>
                          {set.rpe && (
                            <Badge variant="outline" className="text-xs">
                              RPE {set.rpe}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Save as Template */}
          <Button
            onClick={() => setShowSaveTemplate(true)}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <BookmarkPlus className="h-4 w-4" />
            Save as Template
          </Button>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline">
              <Link href="/history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                View History
              </Link>
            </Button>
            <Button asChild>
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Save Template Dialog */}
        {session && (
          <SaveTemplateDialog
            open={showSaveTemplate}
            onClose={() => setShowSaveTemplate(false)}
            session={session}
            onTemplateSaved={() => {
              // Could show a success message here
              console.log('Template saved successfully!');
            }}
          />
        )}
      </div>
    </div>
  );
}