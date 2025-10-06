'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { userRepository } from '@/lib/db/repositories';
import { reseedExercises } from '@/lib/db/seed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User as UserIcon, Dumbbell, Download, Database, RefreshCw } from 'lucide-react';
import type { User } from '@/lib/types';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedResult, setReseedResult] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        email: user.email,
        unitSystem: user.unitSystem,
        defaultRestSec: user.defaultRestSec,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !formData.displayName || !formData.unitSystem) return;

    setIsLoading(true);
    try {
      const updates: Partial<User> = {
        displayName: formData.displayName,
        email: formData.email,
        unitSystem: formData.unitSystem,
        defaultRestSec: formData.defaultRestSec,
      };

      await userRepository.updateUser(user.id, updates);
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReseedExercises = async () => {
    if (!confirm('This will replace all current exercises with the latest built-in exercise library. Your custom exercises will be removed. Are you sure?')) {
      return;
    }

    setIsReseeding(true);
    setReseedResult(null);
    
    try {
      const result = await reseedExercises();
      setReseedResult(`✅ Successfully updated! Cleared ${result.cleared} exercises and added ${result.seeded} new exercises.`);
      setTimeout(() => setReseedResult(null), 5000);
    } catch (error) {
      console.error('Failed to reseed exercises:', error);
      setReseedResult(`❌ Failed to update exercises. Please try again.`);
      setTimeout(() => setReseedResult(null), 5000);
    } finally {
      setIsReseeding(false);
    }
  };

  const hasChanges = user && (
    formData.displayName !== user.displayName ||
    formData.email !== user.email ||
    formData.unitSystem !== user.unitSystem ||
    formData.defaultRestSec !== user.defaultRestSec
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Customize your workout experience
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
            </CardContent>
          </Card>

          {/* Workout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Workout Preferences
              </CardTitle>
              <CardDescription>
                Configure your workout defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unitSystem">Unit System</Label>
                <Select
                  value={formData.unitSystem}
                  onValueChange={(value: 'metric' | 'imperial') => 
                    setFormData({ ...formData, unitSystem: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRestSec">Default Rest Time (seconds)</Label>
                <Select
                  value={formData.defaultRestSec?.toString() || ''}
                  onValueChange={(value) => 
                    setFormData({ ...formData, defaultRestSec: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default rest time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="90">1.5 minutes</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="150">2.5 minutes</SelectItem>
                    <SelectItem value="180">3 minutes</SelectItem>
                    <SelectItem value="240">4 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Timer will automatically start after completing a set
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export and manage your fitness data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Download your workouts, measurements, personal records, and analytics in CSV or JSON format.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/export" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                  </Link>
                </Button>
              </div>
              
              <div className="pt-3 border-t space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Exercise Library</h4>
                  <p className="text-sm text-muted-foreground">
                    Update to the latest built-in exercise collection with standardized names and translations.
                  </p>
                </div>
                <Button 
                  onClick={handleReseedExercises}
                  disabled={isReseeding}
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isReseeding ? 'animate-spin' : ''}`} />
                  {isReseeding ? 'Updating...' : 'Update Exercise Library'}
                </Button>
                {reseedResult && (
                  <p className="text-sm text-center">
                    {reseedResult}
                  </p>
                )}
              </div>
              <div className="pt-3 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data Location</span>
                    <span>Local Device (IndexedDB)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Privacy</span>
                    <span>No cloud storage</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>1.0.0 MVP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span>Local (IndexedDB)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Framework</span>
                <span>Next.js 15</span>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="flex-1 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}