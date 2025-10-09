"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, Square } from "lucide-react";

export function RestTimer() {
  const { restTimer, updateRestTimer, stopRestTimer } = useAppStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (restTimer.isActive && restTimer.remainingSeconds > 0) {
      interval = setInterval(() => {
        updateRestTimer(restTimer.remainingSeconds - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimer.isActive, restTimer.remainingSeconds, updateRestTimer]);

  // Auto-hide when timer is not active or no time remaining
  if (!restTimer.isActive && restTimer.remainingSeconds === 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    ((restTimer.totalSeconds - restTimer.remainingSeconds) /
      restTimer.totalSeconds) *
    100;

  const isTimeUp = restTimer.remainingSeconds === 0;

  return (
    <Card
      className={`mb-6 ${isTimeUp ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}`}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer className={`h-5 w-5 ${isTimeUp ? "text-green-600" : ""}`} />
            <div>
              <div
                className={`text-lg font-mono font-bold ${isTimeUp ? "text-green-600" : ""}`}
              >
                {formatTime(restTimer.remainingSeconds)}
              </div>
              <div className="text-xs text-muted-foreground">
                {isTimeUp ? "Rest complete!" : "Rest time remaining"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTimeUp ? (
              <Button
                onClick={stopRestTimer}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Square className="h-4 w-4 mr-1" />
                Done
              </Button>
            ) : (
              <Button onClick={stopRestTimer} variant="outline" size="sm">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                isTimeUp ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
