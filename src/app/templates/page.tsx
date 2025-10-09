"use client";

import { useState, useEffect } from "react";
import { templateRepository } from "@/lib/db/repositories";
import { useAppStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  Dumbbell,
  Play,
  Star,
  Settings,
  Edit,
  Share2,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { formatDuration } from "@/lib/utils/calculations";
import {
  prepareTemplateForSharing,
  generateTemplateShareUrl,
} from "@/lib/utils/template-sharing";
import type { WorkoutTemplate } from "@/lib/types";
import Link from "next/link";
import QRCode from "qrcode";

export default function TemplatesPage() {
  const { user } = useAppStore();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkoutTemplate[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingTemplate, setSharingTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isGeneratingShareUrl, setIsGeneratingShareUrl] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await templateRepository.getAllTemplates();
        setTemplates(allTemplates);
        setFilteredTemplates(allTemplates);
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (template) => template.category === selectedCategory,
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (template) => template.difficulty === selectedDifficulty,
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedDifficulty]);

  const handleStartTemplate = (templateId: string) => {
    // Navigate to workout page with template ID
    window.location.href = `/workout?template=${templateId}`;
  };

  const handleShareTemplate = async (template: WorkoutTemplate) => {
    if (!user) return;

    setSharingTemplate(template);
    setShareDialogOpen(true);
    setIsGeneratingShareUrl(true);
    setShareUrl("");
    setQrCodeDataUrl("");
    setCopySuccess(false);
    setShowQrCode(false);

    try {
      const shareData = await prepareTemplateForSharing(
        template,
        user.displayName,
      );
      const url = generateTemplateShareUrl(shareData);
      setShareUrl(url);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrCode);
    } catch (error) {
      console.error("Failed to generate share URL:", error);
    } finally {
      setIsGeneratingShareUrl(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const userTemplates = filteredTemplates.filter((t) => !t.isBuiltIn);
  const builtInTemplates = filteredTemplates.filter((t) => t.isBuiltIn);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Workout Templates</h1>
              <p className="text-muted-foreground">
                Start your workouts faster with saved templates
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link
                href="/templates/create"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Create Template
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href="/template-manager"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Import/Export
              </Link>
            </Button>
          </div>
        </header>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category and Difficulty Filters */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                <SelectItem value="powerlifting">Powerlifting</SelectItem>
                <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="general">General Fitness</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Templates */}
        <div className="space-y-8">
          {/* Built-in Templates */}
          {builtInTemplates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Popular Templates
              </h2>
              <div className="grid gap-4">
                {builtInTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onStart={() => handleStartTemplate(template.id)}
                    onShare={handleShareTemplate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* User Templates */}
          {userTemplates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Templates
              </h2>
              <div className="grid gap-4">
                {userTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onStart={() => handleStartTemplate(template.id)}
                    onShare={handleShareTemplate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No templates found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ||
                  selectedCategory !== "all" ||
                  selectedDifficulty !== "all"
                    ? "Try adjusting your filters to see more templates"
                    : "Templates help you quickly start structured workouts. Create one by completing a workout and saving it as a template."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/workout">Start Workout</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/template-manager">Import Templates</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Template</DialogTitle>
              <DialogDescription>
                Share &quot;{sharingTemplate?.name}&quot; with others
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {isGeneratingShareUrl ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Generating share link...</span>
                </div>
              ) : shareUrl ? (
                <div className="space-y-4">
                  {/* Toggle Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant={!showQrCode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowQrCode(false)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Link
                    </Button>
                    <Button
                      variant={showQrCode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowQrCode(true)}
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  </div>

                  {!showQrCode ? (
                    /* Link Sharing */
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Share Link</p>
                        <div className="flex gap-2">
                          <Input
                            value={shareUrl}
                            readOnly
                            className="text-xs"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyShareUrl}
                            className="shrink-0"
                          >
                            {copySuccess ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {copySuccess && (
                          <p className="text-xs text-green-600 mt-2">
                            Link copied to clipboard!
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm">
                          <strong>How to share:</strong> Send this link via
                          text, email, or messaging apps. Recipients can click
                          it to preview and import the template.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* QR Code Sharing */
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-sm font-medium mb-3">QR Code</p>
                        {qrCodeDataUrl && (
                          <div className="flex justify-center">
                            <img
                              src={qrCodeDataUrl}
                              alt="Template QR Code"
                              className="w-48 h-48 border border-border rounded-lg"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm">
                          <strong>How to use:</strong> Have someone scan this QR
                          code with their phone camera or QR scanner app to
                          instantly open the template sharing page.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Failed to generate share link. Please try again.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: WorkoutTemplate;
  onStart: () => void;
  onShare?: (template: WorkoutTemplate) => void;
}

function TemplateCard({ template, onStart, onShare }: TemplateCardProps) {
  const getDifficultyColor = (difficulty: WorkoutTemplate["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCategoryColor = (category: WorkoutTemplate["category"]) => {
    switch (category) {
      case "strength":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "hypertrophy":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "powerlifting":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "bodybuilding":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "endurance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {template.name}
              {template.isBuiltIn && (
                <Star className="h-4 w-4 text-yellow-500" />
              )}
            </CardTitle>
            {template.description && (
              <CardDescription className="mt-1">
                {template.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare(template)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {!template.isBuiltIn && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/templates/create?edit=${template.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button onClick={onStart} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getCategoryColor(template.category)}>
            {template.category}
          </Badge>
          <Badge className={getDifficultyColor(template.difficulty)}>
            {template.difficulty}
          </Badge>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span>{template.exercises.length} exercises</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>~{formatDuration(template.estimatedDuration)}</span>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Exercise Preview */}
        <div className="text-sm">
          <span className="font-medium">Exercises: </span>
          <span className="text-muted-foreground">
            {template.exercises
              .slice(0, 3)
              .map((ex) => ex.exerciseName)
              .join(", ")}
            {template.exercises.length > 3 &&
              ` +${template.exercises.length - 3} more`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
