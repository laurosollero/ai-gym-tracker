"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Image, FileText, ExternalLink } from "lucide-react";
import type { Exercise } from "@/lib/types";

interface ExerciseMediaViewerProps {
  exercise: Exercise;
  className?: string;
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
  <div className="flex flex-col items-center gap-4 py-8">
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
      <Image className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground text-center">{message}</p>
    {link && (
      <Button asChild variant="outline" size="sm">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </a>
      </Button>
    )}
  </div>
);

export function ExerciseMediaViewer({
  exercise,
  className,
}: ExerciseMediaViewerProps) {
  const [activeTab, setActiveTab] = useState<
    "instructions" | "video" | "gif" | "image"
  >("instructions");
  const [gifError, setGifError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const instructions = exercise.instructions?.trim();
  const videoUrl = ensureSafeMediaUrl(exercise.videoUrl);
  const gifUrl = ensureSafeMediaUrl(exercise.gifUrl);
  const imageUrl = ensureSafeMediaUrl(exercise.imageUrl);

  const tabs = useMemo(
    () =>
      [
        {
          id: "instructions" as const,
          label: "Instructions",
          icon: FileText,
          available: Boolean(instructions),
        },
        {
          id: "video" as const,
          label: "Video",
          icon: Play,
          available: Boolean(videoUrl),
        },
        {
          id: "gif" as const,
          label: "GIF",
          icon: Image,
          available: Boolean(gifUrl),
        },
        {
          id: "image" as const,
          label: "Image",
          icon: Image,
          available: Boolean(imageUrl),
        },
      ].filter((tab) => tab.available),
    [instructions, videoUrl, gifUrl, imageUrl],
  );

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  // Don't render if no media is available
  if (tabs.length === 0) {
    return null;
  }

  const renderVideoEmbed = (url: string) => {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    );
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

    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Play className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Video demonstration available
        </p>
        <Button asChild variant="outline">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
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
        {activeTab === "instructions" && instructions && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {instructions}
            </div>
          </div>
        )}

        {activeTab === "video" && videoUrl && (
          <div>{renderVideoEmbed(videoUrl)}</div>
        )}

        {activeTab === "gif" && gifUrl && (
          <div className="text-center">
            {!gifError ? (
              <img
                src={gifUrl}
                alt={`${exercise.name} demonstration`}
                className="max-w-full h-auto rounded-lg mx-auto"
                style={{ maxHeight: "400px" }}
                onError={() => setGifError(true)}
              />
            ) : (
              renderMediaFallback("Failed to load GIF", gifUrl)
            )}
          </div>
        )}

        {activeTab === "image" && imageUrl && (
          <div className="text-center">
            {!imageError ? (
              <img
                src={imageUrl}
                alt={`${exercise.name} form reference`}
                className="max-w-full h-auto rounded-lg mx-auto"
                style={{ maxHeight: "400px" }}
                onError={() => setImageError(true)}
              />
            ) : (
              renderMediaFallback("Failed to load image", imageUrl)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
