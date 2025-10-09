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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Share2, CheckCircle } from "lucide-react";
import type { Exercise } from "@/lib/types";

interface PromoteExerciseDialogProps {
  exercise: Exercise;
  trigger?: React.ReactNode;
}

export function PromoteExerciseDialog({
  exercise,
  trigger,
}: PromoteExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const generatePromotionData = () => {
    return {
      exercise: {
        id: exercise.id,
        name: exercise.name,
        muscles: exercise.muscles,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        videoUrl: exercise.videoUrl,
        gifUrl: exercise.gifUrl,
        imageUrl: exercise.imageUrl,
        notes: exercise.notes,
      },
      reasoning,
      submittedAt: new Date().toISOString(),
      submittedBy: "User", // Could be actual user when auth is implemented
    };
  };

  const handlePromote = () => {
    const promotionData = generatePromotionData();

    // For now, copy to clipboard for manual submission
    navigator.clipboard.writeText(JSON.stringify(promotionData, null, 2));
    setSubmitted(true);

    // Future: Could POST to an API endpoint for automatic processing
    console.log("Exercise promotion request:", promotionData);
  };

  const copyGitHubIssueTemplate = () => {
    const template = `## Exercise Promotion Request

**Exercise Name:** ${exercise.name}
**Muscles:** ${exercise.muscles.join(", ")}
**Equipment:** ${exercise.equipment || "Bodyweight"}

**Why this should be a built-in exercise:**
${reasoning}

**Exercise Details:**
\`\`\`json
${JSON.stringify(generatePromotionData().exercise, null, 2)}
\`\`\`

**Instructions:**
${exercise.instructions || "No instructions provided"}

**Media:**
- Video: ${exercise.videoUrl || "None"}
- GIF: ${exercise.gifUrl || "None"}
- Image: ${exercise.imageUrl || "None"}
`;

    navigator.clipboard.writeText(template);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="h-3 w-3" />
              Promote to Built-in
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Request Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your promotion request has been copied to clipboard. You can now:
            </p>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Paste it as a GitHub issue for review</li>
              <li>Share it with the development team</li>
              <li>Save it for future batch submissions</li>
            </ol>
            <Button onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="h-3 w-3" />
            Promote to Built-in
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote Exercise to Built-in Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{exercise.name}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {exercise.muscles.map((muscle) => (
                <Badge key={muscle} variant="secondary" className="text-xs">
                  {muscle}
                </Badge>
              ))}
              {exercise.equipment && (
                <Badge variant="outline" className="text-xs">
                  {exercise.equipment}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Why should this be a built-in exercise?
            </label>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain why this exercise would benefit all users. Consider:\n• How common/popular is this exercise?\n• Does it target unique muscle groups?\n• Is it a fundamental movement?\n• Does it fill a gap in the current library?"
              rows={4}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={copyGitHubIssueTemplate}
              disabled={!reasoning.trim()}
              className="flex-1"
            >
              Copy GitHub Issue
            </Button>
            <Button
              onClick={handlePromote}
              disabled={!reasoning.trim()}
              variant="outline"
              className="flex-1"
            >
              Copy JSON Data
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Your promotion request will be reviewed by the development team.
            Popular and well-documented exercises are more likely to be
            accepted.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
