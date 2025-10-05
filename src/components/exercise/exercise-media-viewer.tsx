'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Image, FileText, ExternalLink } from 'lucide-react';
import type { Exercise } from '@/lib/types';

interface ExerciseMediaViewerProps {
  exercise: Exercise;
  className?: string;
}

export function ExerciseMediaViewer({ exercise, className }: ExerciseMediaViewerProps) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'video' | 'gif' | 'image'>('instructions');

  const hasInstructions = exercise.instructions?.trim();
  const hasVideo = exercise.videoUrl?.trim();
  const hasGif = exercise.gifUrl?.trim();
  const hasImage = exercise.imageUrl?.trim();

  // Don't render if no media is available
  if (!hasInstructions && !hasVideo && !hasGif && !hasImage) {
    return null;
  }

  const tabs = [
    { id: 'instructions' as const, label: 'Instructions', icon: FileText, available: hasInstructions },
    { id: 'video' as const, label: 'Video', icon: Play, available: hasVideo },
    { id: 'gif' as const, label: 'GIF', icon: Image, available: hasGif },
    { id: 'image' as const, label: 'Image', icon: Image, available: hasImage },
  ].filter(tab => tab.available);

  // Set default active tab to first available
  if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  const renderVideoEmbed = (url: string) => {
    // YouTube URL handling
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Exercise demonstration"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
      );
    }

    // For other video URLs, show link to open externally
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Play className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Video demonstration available
        </p>
        <Button asChild variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Watch Video
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          Exercise Guide
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1"
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTab === 'instructions' && hasInstructions && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {exercise.instructions}
            </div>
          </div>
        )}

        {activeTab === 'video' && hasVideo && (
          <div>
            {renderVideoEmbed(exercise.videoUrl!)}
          </div>
        )}

        {activeTab === 'gif' && hasGif && (
          <div className="text-center">
            <img
              src={exercise.gifUrl}
              alt={`${exercise.name} demonstration`}
              className="max-w-full h-auto rounded-lg mx-auto"
              style={{ maxHeight: '400px' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="flex flex-col items-center gap-4 py-8">
                    <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p class="text-sm text-muted-foreground">Failed to load GIF</p>
                    <a href="${exercise.gifUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline">Open in new tab</a>
                  </div>
                `;
              }}
            />
          </div>
        )}

        {activeTab === 'image' && hasImage && (
          <div className="text-center">
            <img
              src={exercise.imageUrl}
              alt={`${exercise.name} form reference`}
              className="max-w-full h-auto rounded-lg mx-auto"
              style={{ maxHeight: '400px' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="flex flex-col items-center gap-4 py-8">
                    <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p class="text-sm text-muted-foreground">Failed to load image</p>
                    <a href="${exercise.imageUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline">Open in new tab</a>
                  </div>
                `;
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}