'use client';

import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Play, History, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, isUserLoading } = useAppStore();

  if (isUserLoading) {
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
              Welcome back, {user?.displayName || 'User'}
            </p>
          </div>
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Workout
              </CardTitle>
              <CardDescription>
                Begin a new workout session
              </CardDescription>
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
                <History className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>
                View your workout history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/history">View History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Plan (Future) */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Plan</CardTitle>
            <CardDescription>
              No planned workout for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ready to start a free workout session whenever you are!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}