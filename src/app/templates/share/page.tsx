'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { decodeTemplateFromUrl, importTemplateFromShareData, type TemplateShareData } from '@/lib/utils/template-sharing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, Clock, Dumbbell, User } from 'lucide-react';
import type { WorkoutTemplate } from '@/lib/types';
import Link from 'next/link';

function TemplateSharePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAppStore();
  
  const [shareData, setShareData] = useState<TemplateShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedTemplate, setImportedTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    const encodedData = searchParams?.get('data');
    if (!encodedData) {
      setError('No template data found in URL');
      return;
    }

    try {
      const decoded = decodeTemplateFromUrl(encodedData);
      setShareData(decoded);
    } catch (error) {
      console.error('Failed to decode template:', error);
      setError('Invalid sharing link. The template data appears to be corrupted.');
    }
  }, [searchParams]);

  const handleImportTemplate = async () => {
    if (!shareData || !user) return;

    setIsImporting(true);
    try {
      const template = await importTemplateFromShareData(shareData, user.id);
      setImportedTemplate(template);
    } catch (error) {
      console.error('Failed to import template:', error);
      setError('Failed to import template. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'hypertrophy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'powerlifting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'bodybuilding': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'endurance': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Invalid Template Link</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <Link href="/templates">Browse Templates</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (importedTemplate) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">Template Imported Successfully!</h3>
              <p className="text-muted-foreground mb-6">
                &quot;{importedTemplate.name}&quot; has been added to your template library.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/templates">View All Templates</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/workout?template=${importedTemplate.id}`}>Start Workout</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Shared Template</h1>
            <p className="text-muted-foreground">Preview and import this workout template</p>
          </div>
        </header>

        {/* Template Preview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{shareData.template.name}</CardTitle>
                {shareData.template.description && (
                  <CardDescription className="mt-2 text-base">
                    {shareData.template.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getCategoryColor(shareData.template.category)}>
                {shareData.template.category}
              </Badge>
              <Badge className={getDifficultyColor(shareData.template.difficulty)}>
                {shareData.template.difficulty}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span className="text-2xl font-bold">{shareData.template.exercises.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Exercises</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-2xl font-bold">
                    {Math.round(shareData.template.estimatedDuration / 60) || '?'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Hours</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{shareData.exportedBy}</span>
                </div>
                <p className="text-sm text-muted-foreground">Shared by</p>
              </div>
            </div>

            {/* Tags */}
            {shareData.template.tags && shareData.template.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {shareData.template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise Preview */}
            <div>
              <p className="text-sm font-medium mb-3">Exercises ({shareData.template.exercises.length})</p>
              <div className="space-y-2">
                {shareData.template.exercises.slice(0, 5).map((exercise, index) => (
                  <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{exercise.exerciseName}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets.length} sets
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {shareData.template.exercises.length > 5 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      +{shareData.template.exercises.length - 5} more exercises
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Shared:</strong> {new Date(shareData.exportedAt).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <strong>Version:</strong> {shareData.version}
              </p>
            </div>

            {/* Import Button */}
            <Button 
              onClick={handleImportTemplate} 
              disabled={isImporting || !user}
              className="w-full"
              size="lg"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing Template...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import to My Templates
                </>
              )}
            </Button>

            {!user && (
              <p className="text-sm text-center text-muted-foreground">
                Please complete app setup to import templates
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TemplateSharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <TemplateSharePageContent />
    </Suspense>
  );
}