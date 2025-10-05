'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show prompt if already installed or user dismissed it recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      if (!standalone && dismissedTime < oneWeekAgo) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install instructions after a delay if not installed
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('ios-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        if (dismissedTime < oneWeekAgo) {
          setShowPrompt(true);
        }
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('ios-install-dismissed', Date.now().toString());
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="rounded-lg bg-primary/10 p-2">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Install AI Gym Tracker
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {isIOS 
                  ? "Add to your home screen for quick access and offline use"
                  : "Install as an app for better performance and offline access"
                }
              </p>
              
              {isIOS ? (
                <div className="text-xs text-muted-foreground mb-3">
                  <p>1. Tap the Share button in Safari</p>
                  <p>2. Select "Add to Home Screen"</p>
                  <p>3. Tap "Add" to install</p>
                </div>
              ) : null}
              
              <div className="flex gap-2">
                {!isIOS && deferredPrompt && (
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Install
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                >
                  Later
                </Button>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="flex-shrink-0 h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}