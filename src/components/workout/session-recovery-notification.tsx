"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

interface SessionRecoveryNotificationProps {
  sessionId?: string;
  onDismiss?: () => void;
}

export function SessionRecoveryNotification({
  sessionId,
  onDismiss,
}: SessionRecoveryNotificationProps) {
  const [visible, setVisible] = useState(!!sessionId);

  useEffect(() => {
    setVisible(!!sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (visible && sessionId) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, sessionId]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible || !sessionId) {
    return null;
  }

  return (
    <Card className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Workout Session Restored
              </p>
              <p className="text-sm text-green-700 dark:text-green-200">
                Your in-progress workout was automatically recovered
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-green-700 hover:text-green-900 dark:text-green-200 dark:hover:text-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
