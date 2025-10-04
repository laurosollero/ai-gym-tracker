'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { analyticsRepository, personalRecordRepository, workoutStreakRepository } from '@/lib/db/repositories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Trophy, Calendar, Dumbbell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatWeight } from '@/lib/utils/calculations';
import type { WorkoutStats, PersonalRecord, ProgressData, WorkoutStreak } from '@/lib/types';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user } = useAppStore();
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [recentPRs, setRecentPRs] = useState<PersonalRecord[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exerciseProgressData, setExerciseProgressData] = useState<ProgressData[]>([]);
  const [allStreaks, setAllStreaks] = useState<WorkoutStreak[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;

      try {
        const [stats, prs, streaks] = await Promise.all([
          analyticsRepository.getWorkoutStats(user.id),
          personalRecordRepository.getUserRecords(user.id),
          workoutStreakRepository.getUserStreaks(user.id),
        ]);

        setWorkoutStats(stats);
        setRecentPRs(prs.slice(0, 10));
        setAllStreaks(streaks);

        // Set default exercise if available
        if (stats.favoriteExercises.length > 0) {
          setSelectedExercise(stats.favoriteExercises[0].exerciseId);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

  useEffect(() => {
    const loadExerciseProgress = async () => {
      if (!user || !selectedExercise) return;

      try {
        // Get all PRs for this exercise to create progress chart
        const exercisePRs = await personalRecordRepository.getExerciseRecords(user.id, selectedExercise);
        const maxWeightPRs = exercisePRs.filter(pr => pr.recordType === 'max_weight');
        
        const progressData: ProgressData[] = maxWeightPRs.map(pr => ({
          date: pr.achievedAt.toISOString().split('T')[0],
          value: pr.value,
          sessionId: pr.sessionId,
          setId: pr.setId,
          reps: pr.reps,
          weight: pr.weight,
        })).reverse(); // Oldest to newest

        setExerciseProgressData(progressData);
      } catch (error) {
        console.error('Failed to load exercise progress:', error);
      }
    };

    loadExerciseProgress();
  }, [user, selectedExercise]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workoutStats) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <header className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">No workout data available yet</p>
            </div>
          </header>
          <Card>
            <CardContent className="pt-6 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Start tracking your progress</h3>
              <p className="text-muted-foreground mb-4">
                Complete some workouts to see your analytics and progress charts
              </p>
              <Button asChild>
                <Link href="/workout">Start Workout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Prepare data for charts

  const favoriteExercisesData = workoutStats.favoriteExercises.map(ex => ({
    name: ex.exerciseName.length > 15 ? ex.exerciseName.substring(0, 15) + '...' : ex.exerciseName,
    value: ex.count,
    fullName: ex.exerciseName,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your fitness progress and achievements</p>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{workoutStats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{workoutStats.longestStreak}</div>
              <div className="text-xs text-muted-foreground">Longest Streak</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {formatWeight(workoutStats.totalVolume, user?.unitSystem || 'metric')}
              </div>
              <div className="text-xs text-muted-foreground">Total Volume</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Dumbbell className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{workoutStats.totalWorkouts}</div>
              <div className="text-xs text-muted-foreground">Total Workouts</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="exercise-progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exercise-progress">Exercise Progress</TabsTrigger>
            <TabsTrigger value="workout-streaks">Workout Streaks</TabsTrigger>
            <TabsTrigger value="favorite-exercises">Favorite Exercises</TabsTrigger>
            <TabsTrigger value="recent-prs">Recent PRs</TabsTrigger>
          </TabsList>

          <TabsContent value="exercise-progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Progress</CardTitle>
                <CardDescription>Track strength gains over time</CardDescription>
                <div className="flex gap-4">
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select an exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {workoutStats.favoriteExercises.map((ex) => (
                        <SelectItem key={ex.exerciseId} value={ex.exerciseId}>
                          {ex.exerciseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {exerciseProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={exerciseProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatWeight(value, user?.unitSystem || 'metric')}
                      />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                        formatter={(value: number) => [
                          formatWeight(value, user?.unitSystem || 'metric'),
                          'Max Weight'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No progress data available for this exercise</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workout-streaks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workout Streaks</CardTitle>
                <CardDescription>Your workout consistency patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                {allStreaks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{workoutStats?.currentStreak || 0}</div>
                        <div className="text-sm text-muted-foreground">Current Streak</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{workoutStats?.longestStreak || 0}</div>
                        <div className="text-sm text-muted-foreground">Longest Streak</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {allStreaks.slice(0, 10).map((streak, index) => (
                        <div key={streak.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-medium">
                                {streak.workoutCount} day{streak.workoutCount !== 1 ? 's' : ''} streak
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(streak.startDate).toLocaleDateString()} - {streak.endDate ? new Date(streak.endDate).toLocaleDateString() : 'Ongoing'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {streak.isCurrent ? (
                                <span className="text-green-600 text-sm font-semibold">CURRENT</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">#{index + 1}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No workout streaks yet</p>
                    <p className="text-sm text-muted-foreground">Complete workouts on consecutive days to build streaks!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorite-exercises" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Exercises</CardTitle>
                <CardDescription>Most frequently performed exercises</CardDescription>
              </CardHeader>
              <CardContent>
                {favoriteExercisesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={favoriteExercisesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {favoriteExercisesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Complete more workouts to see your favorite exercises</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent-prs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Personal Records</CardTitle>
                <CardDescription>Your latest achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {recentPRs.length > 0 ? (
                  <div className="space-y-3">
                    {recentPRs.map((pr) => (
                      <div key={pr.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          <div>
                            <div className="font-medium">{pr.exerciseName}</div>
                            <div className="text-sm text-muted-foreground">
                              {pr.recordType.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {pr.recordType === 'max_weight' && `${formatWeight(pr.value, user?.unitSystem || 'metric')} x ${pr.reps}`}
                            {pr.recordType === 'max_reps' && `${pr.value} reps`}
                            {pr.recordType === 'max_volume' && formatWeight(pr.value, user?.unitSystem || 'metric')}
                            {pr.recordType === 'best_estimated_1rm' && `${formatWeight(pr.value, user?.unitSystem || 'metric')} 1RM`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pr.achievedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No personal records yet</p>
                    <p className="text-sm text-muted-foreground">Complete workouts to start setting PRs!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}