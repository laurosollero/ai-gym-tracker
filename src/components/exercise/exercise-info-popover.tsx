"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Info, Play, Image, FileText, ExternalLink } from "lucide-react";
import type { Exercise } from "@/lib/types";

interface ExerciseInfoPopoverProps {
  exercise: Exercise;
  triggerClassName?: string;
}

const ensureSafeMediaUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const base =
      typeof window !== "undefined" && window.location
        ? window.location.origin
        : "http://localhost";
    const url = new URL(trimmed, base);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
};

const renderMediaFallback = (message: string, link?: string) => (
  <div className="text-center py-4">
    <p className="text-xs text-muted-foreground">{message}</p>
    {link && (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        Open in new tab
      </a>
    )}
  </div>
);

export function ExerciseInfoPopover({
  exercise,
  triggerClassName,
}: ExerciseInfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [gifError, setGifError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const instructions = exercise.instructions?.trim();
  const videoUrl = ensureSafeMediaUrl(exercise.videoUrl);
  const gifUrl = ensureSafeMediaUrl(exercise.gifUrl);
  const imageUrl = ensureSafeMediaUrl(exercise.imageUrl);
  const hasMedia = Boolean(instructions || videoUrl || gifUrl || imageUrl);

  if (!hasMedia && !exercise.notes) {
    return null;
  }

  const renderVideoEmbed = (url: string) => {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    );
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <div className="aspect-video w-full max-w-sm">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Exercise demonstration"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded"
          />
        </div>
      );
    }

    return (
      <Button asChild variant="outline" size="sm">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Watch Video
        </a>
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName}>
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="flex flex-wrap gap-1">
              {exercise.muscles.map((muscle) => (
                <Badge key={muscle} variant="secondary" className="text-xs">
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>

          {exercise.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Notes
              </p>
              <p className="text-xs leading-relaxed">{exercise.notes}</p>
            </div>
          )}

          {instructions && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FileText className="h-3 w-3" />
                <p className="text-xs font-medium text-muted-foreground">
                  Instructions
                </p>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
          )}

          {videoUrl && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Play className="h-3 w-3" />
                <p className="text-xs font-medium text-muted-foreground">
                  Video
                </p>
              </div>
              {renderVideoEmbed(videoUrl)}
            </div>
          )}

          {gifUrl && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Image className="h-3 w-3" />
                <p className="text-xs font-medium text-muted-foreground">
                  Animation
                </p>
              </div>
              {!gifError ? (
                <img
                  src={gifUrl}
                  alt={`${exercise.name} demonstration`}
                  className="w-full h-auto rounded max-h-48 object-contain"
                  onError={() => setGifError(true)}
                />
              ) : (
                renderMediaFallback("Failed to load GIF", gifUrl)
              )}
            </div>
          )}

          {imageUrl && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Image className="h-3 w-3" />
                <p className="text-xs font-medium text-muted-foreground">
                  Reference
                </p>
              </div>
              {!imageError ? (
                <img
                  src={imageUrl}
                  alt={`${exercise.name} form reference`}
                  className="w-full h-auto rounded max-h-48 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                renderMediaFallback("Failed to load image", imageUrl)
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
