"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { bodyMeasurementRepository } from "@/lib/db/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Ruler,
  TrendingUp,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatWeight, formatHeight } from "@/lib/utils/calculations";
import type { BodyMeasurement } from "@/lib/types";

type BodyMeasurementType = BodyMeasurement["measurementType"];
import Link from "next/link";

const MEASUREMENT_TYPES: {
  value: BodyMeasurementType;
  label: string;
  unit: string;
}[] = [
  { value: "weight", label: "Weight", unit: "kg/lbs" },
  { value: "body_fat", label: "Body Fat %", unit: "%" },
  { value: "muscle_mass", label: "Muscle Mass", unit: "kg/lbs" },
  { value: "chest", label: "Chest", unit: "cm/in" },
  { value: "waist", label: "Waist", unit: "cm/in" },
  { value: "hips", label: "Hips", unit: "cm/in" },
  { value: "bicep", label: "Bicep", unit: "cm/in" },
  { value: "thigh", label: "Thigh", unit: "cm/in" },
  { value: "neck", label: "Neck", unit: "cm/in" },
];

export default function MeasurementsPage() {
  const { user } = useAppStore();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [selectedType, setSelectedType] =
    useState<BodyMeasurementType>("weight");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [activeTab, setActiveTab] = useState("progress");

  // Form state
  const [newMeasurement, setNewMeasurement] = useState({
    measurementType: "weight" as BodyMeasurementType,
    value: "",
    notes: "",
  });

  useEffect(() => {
    const loadMeasurements = async () => {
      if (!user) return;

      try {
        const userMeasurements =
          await bodyMeasurementRepository.getUserMeasurements(user.id);
        setMeasurements(userMeasurements);
      } catch (error) {
        console.error("Failed to load measurements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeasurements();
  }, [user]);

  const handleAddMeasurement = async () => {
    if (!user || !newMeasurement.value) return;

    try {
      const measurement: Omit<BodyMeasurement, "createdAt"> = {
        id: crypto.randomUUID(),
        userId: user.id,
        measurementType: newMeasurement.measurementType,
        value: parseFloat(newMeasurement.value),
        unit:
          user.unitSystem === "imperial"
            ? newMeasurement.measurementType === "weight" ||
              newMeasurement.measurementType === "muscle_mass"
              ? "lbs"
              : "in"
            : newMeasurement.measurementType === "weight" ||
                newMeasurement.measurementType === "muscle_mass"
              ? "kg"
              : "cm",
        notes: newMeasurement.notes || undefined,
        date: new Date().toISOString().split("T")[0],
      };

      const newMeasurementWithId =
        await bodyMeasurementRepository.createMeasurement(measurement);

      setMeasurements((prev) => [newMeasurementWithId, ...prev]);

      // Reset form
      setNewMeasurement({
        measurementType: "weight",
        value: "",
        notes: "",
      });
      setIsAddingMeasurement(false);
    } catch (error) {
      console.error("Failed to add measurement:", error);
    }
  };

  const handleDeleteMeasurement = async (measurementId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this measurement? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await bodyMeasurementRepository.deleteMeasurement(measurementId);
      setMeasurements((prev) => prev.filter((m) => m.id !== measurementId));
    } catch (error) {
      console.error("Failed to delete measurement:", error);
    }
  };

  const getChartData = (measurementType: BodyMeasurementType) => {
    return measurements
      .filter((m) => m.measurementType === measurementType)
      .map((m) => ({
        date: m.date,
        value: m.value,
        notes: m.notes,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatValue = (value: number, type: BodyMeasurementType) => {
    if (type === "body_fat") {
      return `${value}%`;
    }
    if (type === "weight" || type === "muscle_mass") {
      return formatWeight(value, user?.unitSystem || "metric");
    }
    return formatHeight(value, user?.unitSystem || "metric");
  };

  const getLatestMeasurement = (measurementType: BodyMeasurementType) => {
    const typeMeasurements = measurements.filter(
      (m) => m.measurementType === measurementType,
    );
    return typeMeasurements.length > 0 ? typeMeasurements[0] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = getChartData(selectedType);
  const latestWeight = getLatestMeasurement("weight");
  const latestBodyFat = getLatestMeasurement("body_fat");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="space-y-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">Body Measurements</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track your physical progress over time
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddingMeasurement(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Measurement
          </Button>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card>
            <CardContent className="p-3 text-center">
              <Ruler className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <div className="text-lg sm:text-xl font-bold truncate">
                {latestWeight
                  ? formatValue(latestWeight.value, "weight")
                  : "---"}
              </div>
              <div className="text-xs text-muted-foreground">
                Weight
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <div className="text-lg sm:text-xl font-bold truncate">
                {latestBodyFat ? `${latestBodyFat.value}%` : "---"}
              </div>
              <div className="text-xs text-muted-foreground">Body Fat</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <div className="text-lg sm:text-xl font-bold">{measurements.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 text-center">
              <Ruler className="h-4 w-4 mx-auto mb-1 text-orange-500" />
              <div className="text-lg sm:text-xl font-bold">
                {
                  measurements.filter(
                    (m) =>
                      new Date(m.date) >=
                      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Measurement Form */}
        {isAddingMeasurement && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Measurement</CardTitle>
              <CardDescription>Record a new body measurement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                <div>
                  <Label htmlFor="type" className="text-sm font-medium">Measurement Type</Label>
                  <Select
                    value={newMeasurement.measurementType}
                    onValueChange={(value: BodyMeasurementType) =>
                      setNewMeasurement((prev) => ({
                        ...prev,
                        measurementType: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} ({type.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value" className="text-sm font-medium">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.1"
                    value={newMeasurement.value}
                    onChange={(e) =>
                      setNewMeasurement((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    placeholder="Enter value"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={newMeasurement.notes}
                    onChange={(e) =>
                      setNewMeasurement((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add notes..."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleAddMeasurement}
                  disabled={!newMeasurement.value}
                  className="w-full sm:w-auto"
                >
                  Add Measurement
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingMeasurement(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="space-y-6">
          {/* Mobile: Dropdown selector */}
          <div className="sm:hidden">
            <Select 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Progress Charts</SelectItem>
                <SelectItem value="history">Measurement History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Traditional tabs */}
          <div className="hidden sm:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="progress">Progress Charts</TabsTrigger>
                <TabsTrigger value="history">Measurement History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Progress Charts Content */}
          {activeTab === "progress" && (
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Visual representation of your measurement changes
                </CardDescription>
                <div className="flex gap-4">
                  <Select
                    value={selectedType}
                    onValueChange={(value: BodyMeasurementType) =>
                      setSelectedType(value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString()
                        }
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          formatValue(value, selectedType)
                        }
                      />
                      <Tooltip
                        labelFormatter={(value) =>
                          new Date(value as string).toLocaleDateString()
                        }
                        formatter={(value: number) => [
                          formatValue(value, selectedType),
                          MEASUREMENT_TYPES.find(
                            (t) => t.value === selectedType,
                          )?.label || selectedType,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <Ruler className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No measurements recorded for{" "}
                      {MEASUREMENT_TYPES.find(
                        (t) => t.value === selectedType,
                      )?.label.toLowerCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add your first measurement to see progress
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Measurement History Content */}
          {activeTab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle>Measurement History</CardTitle>
                <CardDescription>
                  All your recorded measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {measurements.length > 0 ? (
                  <div className="space-y-3">
                    {measurements.slice(0, 20).map((measurement) => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between p-3 border rounded-lg group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Ruler className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {MEASUREMENT_TYPES.find(
                                (t) => t.value === measurement.measurementType,
                              )?.label || measurement.measurementType}
                            </div>
                            {measurement.notes && (
                              <div className="text-sm text-muted-foreground truncate">
                                {measurement.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {formatValue(
                                measurement.value,
                                measurement.measurementType,
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(measurement.date).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteMeasurement(measurement.id)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Ruler className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      No measurements recorded yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Track your body measurements to see progress beyond just
                      strength gains. Start with weight, then add measurements
                      like waist, chest, or muscle mass.
                    </p>
                    <Button onClick={() => setIsAddingMeasurement(true)}>
                      Add First Measurement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
