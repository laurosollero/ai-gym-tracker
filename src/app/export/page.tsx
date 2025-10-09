"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  sessionRepository,
  personalRecordRepository,
  bodyMeasurementRepository,
  workoutStreakRepository,
  exerciseRepository,
  templateRepository,
} from "@/lib/db/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, FileText, Database } from "lucide-react";
import Link from "next/link";

type ExportFormat = "csv" | "json";
type DataType =
  | "workouts"
  | "exercises"
  | "measurements"
  | "records"
  | "streaks"
  | "templates";

interface ExportOptions {
  format: ExportFormat;
  dataTypes: DataType[];
  includeDetails: boolean;
}

export default function ExportPage() {
  const { user } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    dataTypes: ["workouts"],
    includeDetails: true,
  });

  const dataTypeOptions = [
    {
      value: "workouts" as DataType,
      label: "Workout Sessions",
      description: "All workout sessions with exercises and sets",
    },
    {
      value: "exercises" as DataType,
      label: "Exercises",
      description: "Exercise database with muscle groups and equipment",
    },
    {
      value: "measurements" as DataType,
      label: "Body Measurements",
      description: "Weight, body fat, and body measurements",
    },
    {
      value: "records" as DataType,
      label: "Personal Records",
      description: "PRs for max weight, reps, volume, and 1RM estimates",
    },
    {
      value: "streaks" as DataType,
      label: "Workout Streaks",
      description: "Workout consistency streaks and patterns",
    },
    {
      value: "templates" as DataType,
      label: "Workout Templates",
      description: "Saved workout templates and routines",
    },
  ];

  const handleDataTypeChange = (dataType: DataType, checked: boolean) => {
    setExportOptions((prev) => ({
      ...prev,
      dataTypes: checked
        ? [...prev.dataTypes, dataType]
        : prev.dataTypes.filter((type) => type !== dataType),
    }));
  };

  const downloadFile = (
    content: string,
    filename: string,
    contentType: string,
  ) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (
    data: Record<string, unknown>[],
    headers: string[],
  ): string => {
    const csvHeaders = headers.join(",");
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(","),
    );
    return [csvHeaders, ...csvRows].join("\n");
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  };

  const exportData = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      const exportData: Record<string, unknown> = {};
      const timestamp = new Date().toISOString().split("T")[0];

      // Export workouts
      if (exportOptions.dataTypes.includes("workouts")) {
        const sessions = await sessionRepository.getUserSessions(user.id);
        if (exportOptions.format === "csv") {
          const workoutData = sessions.map((session) => ({
            date: session.date,
            startedAt: session.startedAt ? session.startedAt.toISOString() : "",
            endedAt: session.endedAt ? session.endedAt.toISOString() : "",
            duration:
              session.startedAt && session.endedAt
                ? Math.round(
                    (session.endedAt.getTime() - session.startedAt.getTime()) /
                      (1000 * 60),
                  )
                : "",
            exerciseCount: session.exercises.length,
            totalSets: session.exercises.reduce(
              (sum, ex) => sum + ex.sets.length,
              0,
            ),
            notes: session.notes || "",
          }));

          if (exportOptions.includeDetails) {
            // Include detailed exercise and set data
            const detailedData = sessions.flatMap((session) =>
              session.exercises.flatMap((exercise) =>
                exercise.sets.map((set) => ({
                  sessionDate: session.date,
                  exerciseName: exercise.nameAtTime,
                  setIndex: set.index,
                  reps: set.reps || "",
                  weight: set.weight || "",
                  isWarmup: set.isWarmup ? "Yes" : "No",
                  restSec: set.restSec || "",
                  completedAt: set.completedAt
                    ? set.completedAt.toISOString()
                    : "",
                  notes: set.notes || "",
                })),
              ),
            );
            exportData.workoutSets = detailedData;
          }

          exportData.workouts = workoutData;
        } else {
          exportData.workouts = sessions;
        }
      }

      // Export exercises
      if (exportOptions.dataTypes.includes("exercises")) {
        const exercises = await exerciseRepository.getAllExercises();
        exportData.exercises = exercises.map((ex) => ({
          name: ex.name,
          muscles: Array.isArray(ex.muscles)
            ? ex.muscles.join("; ")
            : ex.muscles,
          equipment: ex.equipment || "",
          isCustom: ex.isCustom ? "Yes" : "No",
          notes: ex.notes || "",
        }));
      }

      // Export measurements
      if (exportOptions.dataTypes.includes("measurements")) {
        const measurements =
          await bodyMeasurementRepository.getUserMeasurements(user.id);
        exportData.measurements = measurements.map((m) => ({
          date: m.date,
          measurementType: m.measurementType,
          value: m.value,
          unit: m.unit,
          notes: m.notes || "",
        }));
      }

      // Export personal records
      if (exportOptions.dataTypes.includes("records")) {
        const records = await personalRecordRepository.getUserRecords(user.id);
        exportData.personalRecords = records.map((pr) => ({
          exerciseName: pr.exerciseName,
          recordType: pr.recordType,
          value: pr.value,
          weight: pr.weight || "",
          reps: pr.reps || "",
          achievedAt: formatDate(pr.achievedAt),
        }));
      }

      // Export streaks
      if (exportOptions.dataTypes.includes("streaks")) {
        const streaks = await workoutStreakRepository.getUserStreaks(user.id);
        exportData.streaks = streaks.map((streak) => ({
          startDate: streak.startDate,
          endDate: streak.endDate || "",
          workoutCount: streak.workoutCount,
          isCurrent: streak.isCurrent ? "Yes" : "No",
        }));
      }

      // Export templates
      if (exportOptions.dataTypes.includes("templates")) {
        const templates = await templateRepository.getUserTemplates(user.id);
        if (exportOptions.format === "csv") {
          const templateData = templates.map((template) => ({
            name: template.name,
            exerciseCount: template.exercises.length,
            isBuiltIn: template.isBuiltIn ? "Yes" : "No",
            description: template.description || "",
          }));
          exportData.templates = templateData;

          if (exportOptions.includeDetails) {
            const templateExercises = templates.flatMap((template) =>
              template.exercises.map((ex) => ({
                templateName: template.name,
                exerciseName: ex.exerciseName,
                orderIndex: ex.orderIndex,
                setsCount: ex.sets.length,
                restSeconds: ex.restSeconds || "",
                notes: ex.notes || "",
              })),
            );
            exportData.templateExercises = templateExercises;
          }
        } else {
          exportData.templates = templates;
        }
      }

      // Generate and download files
      if (exportOptions.format === "csv") {
        // Create separate CSV files for each data type
        Object.entries(exportData).forEach(([key, data]) => {
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const csv = convertToCSV(data, headers);
            downloadFile(
              csv,
              `gym-tracker-${key}-${timestamp}.csv`,
              "text/csv",
            );
          }
        });
      } else {
        // Single JSON file with all data
        const json = JSON.stringify(exportData, null, 2);
        downloadFile(
          json,
          `gym-tracker-export-${timestamp}.json`,
          "application/json",
        );
      }

      // Show success message (you could add a toast notification here)
      console.log("Export completed successfully");
    } catch (error) {
      console.error("Export failed:", error);
      // Show error message (you could add a toast notification here)
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Export Data</h1>
            <p className="text-muted-foreground">
              Download your fitness data and progress
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
                <CardDescription>
                  Choose how you want your data formatted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={exportOptions.format}
                  onValueChange={(value: ExportFormat) =>
                    setExportOptions((prev) => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      CSV (Spreadsheet friendly) - Multiple files
                    </SelectItem>
                    <SelectItem value="json">
                      JSON (Complete data structure) - Single file
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Data Types Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Data to Export</CardTitle>
                <CardDescription>
                  Select which types of data to include in your export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={option.value}
                      checked={exportOptions.dataTypes.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleDataTypeChange(option.value, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Additional settings for your export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={exportOptions.includeDetails}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeDetails: checked as boolean,
                      }))
                    }
                  />
                  <label
                    htmlFor="includeDetails"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include detailed data (individual sets, template exercises)
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Summary & Action */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Export Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Format:</div>
                  <div className="text-sm text-muted-foreground">
                    {exportOptions.format.toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Data Types:</div>
                  <div className="text-sm text-muted-foreground">
                    {exportOptions.dataTypes.length > 0
                      ? exportOptions.dataTypes
                          .map(
                            (type) =>
                              dataTypeOptions.find((opt) => opt.value === type)
                                ?.label,
                          )
                          .join(", ")
                      : "None selected"}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Details:</div>
                  <div className="text-sm text-muted-foreground">
                    {exportOptions.includeDetails ? "Included" : "Summary only"}
                  </div>
                </div>

                <Button
                  onClick={exportData}
                  disabled={isExporting || exportOptions.dataTypes.length === 0}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your data is exported directly from your local database. No
                  data is sent to external servers.
                </p>
                <p className="text-sm text-muted-foreground">
                  Exported files contain your personal fitness data. Keep them
                  secure and only share with trusted parties.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
