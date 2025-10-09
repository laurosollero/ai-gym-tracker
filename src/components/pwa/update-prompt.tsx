"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Check for existing registration
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker installed and ready
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Listen for waiting service worker
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Service worker updated, reload to get new content
        if (updateAvailable) {
          window.location.reload();
        }
      });
    }
  }, [updateAvailable]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to take control
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md border-blue-500 bg-blue-50 dark:bg-blue-950">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Update Available
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              A new version of the app is ready. Reload to get the latest
              features.
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Update
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="border-blue-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
