'use client';

import { useState, useEffect } from 'react';
import { sessionRepository } from '@/lib/db/repositories';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Dumbbell } from 'lucide-react';
import { calculateSessionSummary, formatWeight, formatDuration } from '@/lib/utils/calculations';
import type { WorkoutSession } from '@/lib/types';
import Link from 'next/link';

export default function HistoryPage() {
  const { user } = useAppStore();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;

      try {
        const userSessions = await sessionRepository.getUserSessions(user.id, 20);
        setSessions(userSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Workout History</h1>
            <p className="text-muted-foreground">
              {sessions.length} workout{sessions.length !== 1 ? 's' : ''} completed
            </p>
          </div>
        </header>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">
                Your workout history will appear here once you complete your first session.
                Each workout shows details like exercises, sets, and total volume.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/workout">Start First Workout</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/templates">Browse Templates</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const summary = calculateSessionSummary(session);
              const sessionDate = new Date(session.date);
              
              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {sessionDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {summary.exerciseCount} exercise{summary.exerciseCount !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline">
                          {summary.totalSets} sets
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Summary Stats */}
                    <div className="flex gap-6 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{formatDuration(summary.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dumbbell className="h-4 w-4 text-green-500" />
                        <span>{formatWeight(summary.totalVolume, user?.unitSystem || 'metric')} volume</span>
                      </div>
                    </div>

                    {/* Exercise List */}
                    <div className="space-y-2">
                      {session.exercises.map((exercise, index) => {
                        const completedSets = exercise.sets.filter(set => set.completedAt).length;
                        
                        return (
                          <div key={exercise.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{exercise.nameAtTime}</span>
                            <span className="text-muted-foreground">
                              {completedSets} set{completedSets !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* View Details Button */}
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/workout-review?id=${session.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}