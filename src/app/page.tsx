"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { sessionRepository } from "@/lib/db/repositories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dumbbell,
  Play,
  History,
  Settings,
  BookOpen,
  BarChart3,
  Ruler,
  Calculator,
  Star,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, isUserLoading } = useAppStore();
  const [hasCompletedWorkouts, setHasCompletedWorkouts] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const checkWorkoutHistory = async () => {
      if (!user) return;

      try {
        const sessions = await sessionRepository.getUserSessions(user.id);
        setHasCompletedWorkouts(sessions.length > 0);
      } catch (error) {
        console.error("Failed to check workout history:", error);
        setHasCompletedWorkouts(false);
      }
    };

    checkWorkoutHistory();
  }, [user]);

  if (isUserLoading || hasCompletedWorkouts === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-8 w-8" />
              Gym Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.displayName || "User"}
            </p>
          </div>
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Workout
              </CardTitle>
              <CardDescription>Begin a new workout session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/workout">Start New Session</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Templates
              </CardTitle>
              <CardDescription>
                Browse and create workout templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/templates">Browse Templates</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/templates/create">Create Template</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>View progress and stats</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>View your workout history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/history">View History</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Measurements
              </CardTitle>
              <CardDescription>Track body measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/measurements">Track Progress</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Plate Calculator
              </CardTitle>
              <CardDescription>Calculate plates for any weight</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/plate-calculator">Calculate Plates</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Exercise Library
              </CardTitle>
              <CardDescription>Browse and manage exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/exercises">Browse Exercises</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Content Based on User Experience */}
        {!hasCompletedWorkouts ? (
          /* New User Onboarding */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Welcome to Gym Tracker!
              </CardTitle>
              <CardDescription>
                Get started with your fitness journey in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Start Your First Workout
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Start New Session&quot; to begin logging
                    exercises, sets, and reps
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Browse Templates</p>
                  <p className="text-xs text-muted-foreground">
                    Explore pre-built workouts for different goals and
                    experience levels
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Track Your Progress</p>
                  <p className="text-xs text-muted-foreground">
                    View detailed analytics and personal records as you grow
                    stronger
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button asChild className="w-full">
                  <Link href="/workout">Start Your Fitness Journey</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Returning User - Recent Activity */
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Keep up the great work! Here are some quick ways to continue
                your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                >
                  <Link href="/workout">
                    <Play className="h-4 w-4" />
                    <span className="text-xs">Quick Start</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                >
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">View Progress</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
