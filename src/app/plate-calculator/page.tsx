"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calculator, Info } from "lucide-react";
import Link from "next/link";

interface PlateConfig {
  weight: number;
  color: string;
  count: number;
}

interface BarConfig {
  weight: number;
  name: string;
}

// Standard plate configurations
const METRIC_PLATES: PlateConfig[] = [
  { weight: 25, color: "#ef4444", count: 4 }, // Red - 25kg
  { weight: 20, color: "#3b82f6", count: 4 }, // Blue - 20kg
  { weight: 15, color: "#eab308", count: 4 }, // Yellow - 15kg
  { weight: 10, color: "#22c55e", count: 4 }, // Green - 10kg
  { weight: 5, color: "#ffffff", count: 4 }, // White - 5kg
  { weight: 2.5, color: "#ef4444", count: 4 }, // Red - 2.5kg
  { weight: 1.25, color: "#6b7280", count: 4 }, // Gray - 1.25kg
];

const IMPERIAL_PLATES: PlateConfig[] = [
  { weight: 45, color: "#ef4444", count: 4 }, // Red - 45lbs
  { weight: 35, color: "#3b82f6", count: 4 }, // Blue - 35lbs
  { weight: 25, color: "#eab308", count: 4 }, // Yellow - 25lbs
  { weight: 10, color: "#22c55e", count: 4 }, // Green - 10lbs
  { weight: 5, color: "#ffffff", count: 4 }, // White - 5lbs
  { weight: 2.5, color: "#ef4444", count: 4 }, // Red - 2.5lbs
];

const METRIC_BARS: BarConfig[] = [
  { weight: 20, name: "Olympic Barbell (20kg)" },
  { weight: 15, name: "Women's Barbell (15kg)" },
  { weight: 10, name: "Training Bar (10kg)" },
  { weight: 0, name: "Dumbbells / No Bar" },
];

const IMPERIAL_BARS: BarConfig[] = [
  { weight: 45, name: "Olympic Barbell (45lbs)" },
  { weight: 35, name: "Women's Barbell (35lbs)" },
  { weight: 25, name: "Training Bar (25lbs)" },
  { weight: 0, name: "Dumbbells / No Bar" },
];

interface PlateCalculation {
  plate: PlateConfig;
  count: number;
}

export default function PlateCalculatorPage() {
  const { user } = useAppStore();
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [barWeight, setBarWeight] = useState<number>(20); // Default to Olympic bar
  const [calculation, setCalculation] = useState<PlateCalculation[]>([]);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(true);

  const isMetric = user?.unitSystem === "metric";
  const plates = isMetric ? METRIC_PLATES : IMPERIAL_PLATES;
  const bars = isMetric ? METRIC_BARS : IMPERIAL_BARS;
  const unit = isMetric ? "kg" : "lbs";

  // Set default bar weight when unit system changes
  useEffect(() => {
    if (isMetric) {
      setBarWeight(20); // Olympic bar in kg
    } else {
      setBarWeight(45); // Olympic bar in lbs
    }
  }, [isMetric]);

  const calculatePlates = (target: number, bar: number): PlateCalculation[] => {
    const weightPerSide = (target - bar) / 2;

    if (weightPerSide <= 0) {
      return [];
    }

    const result: PlateCalculation[] = [];
    let remainingWeight = weightPerSide;

    // Sort plates by weight (heaviest first)
    const sortedPlates = [...plates].sort((a, b) => b.weight - a.weight);

    for (const plate of sortedPlates) {
      if (remainingWeight >= plate.weight && plate.count > 0) {
        const neededCount = Math.min(
          Math.floor(remainingWeight / plate.weight),
          plate.count,
        );

        if (neededCount > 0) {
          result.push({
            plate: { ...plate },
            count: neededCount,
          });
          remainingWeight -= neededCount * plate.weight;
        }
      }
    }

    return result;
  };

  const handleCalculate = useCallback(() => {
    const target = parseFloat(targetWeight);

    if (isNaN(target) || target <= 0) {
      setIsValid(false);
      setCalculation([]);
      setTotalWeight(0);
      return;
    }

    if (target < barWeight) {
      setIsValid(false);
      setCalculation([]);
      setTotalWeight(barWeight);
      return;
    }

    const result = calculatePlates(target, barWeight);
    const calculatedWeight =
      barWeight +
      result.reduce((sum, item) => sum + item.plate.weight * item.count * 2, 0);

    setCalculation(result);
    setTotalWeight(calculatedWeight);
    setIsValid(Math.abs(calculatedWeight - target) < 0.01);
  }, [targetWeight, barWeight, plates]);

  useEffect(() => {
    if (targetWeight) {
      handleCalculate();
    } else {
      setCalculation([]);
      setTotalWeight(0);
      setIsValid(true);
    }
  }, [targetWeight, barWeight, handleCalculate]);

  const PlateVisualization = ({
    plates: plateCalc,
  }: {
    plates: PlateCalculation[];
  }) => {
    if (plateCalc.length === 0) return null;

    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        {/* Left side plates */}
        <div className="flex space-x-1">
          {plateCalc.map((item, index) => (
            <div key={`left-${index}`} className="flex space-x-1">
              {Array.from({ length: item.count }).map((_, plateIndex) => (
                <div
                  key={`left-${index}-${plateIndex}`}
                  className="w-4 h-12 rounded-sm border-2 border-gray-300"
                  style={{ backgroundColor: item.plate.color }}
                  title={`${item.plate.weight}${unit}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Barbell */}
        <div className="w-16 h-2 bg-gray-600 rounded"></div>

        {/* Right side plates */}
        <div className="flex space-x-1">
          {plateCalc.map((item, index) => (
            <div key={`right-${index}`} className="flex space-x-1">
              {Array.from({ length: item.count }).map((_, plateIndex) => (
                <div
                  key={`right-${index}-${plateIndex}`}
                  className="w-4 h-12 rounded-sm border-2 border-gray-300"
                  style={{ backgroundColor: item.plate.color }}
                  title={`${item.plate.weight}${unit}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
            <h1 className="text-3xl font-bold">Plate Calculator</h1>
            <p className="text-muted-foreground">
              Calculate which plates to load for any weight
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Target Weight
              </CardTitle>
              <CardDescription>
                Enter your target weight and select your barbell type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Target Weight ({unit})</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    step={isMetric ? "1.25" : "2.5"}
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder={`Enter weight in ${unit}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barWeight">Barbell Type</Label>
                  <Select
                    value={barWeight.toString()}
                    onValueChange={(value) => setBarWeight(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bars.map((bar) => (
                        <SelectItem
                          key={bar.weight}
                          value={bar.weight.toString()}
                        >
                          {bar.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {targetWeight && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isValid ? "Plate Loading" : "Cannot Load Exact Weight"}
                </CardTitle>
                <CardDescription>
                  {isValid
                    ? `Total weight: ${totalWeight}${unit}`
                    : targetWeight && parseFloat(targetWeight) < barWeight
                      ? `Target weight (${targetWeight}${unit}) is less than bar weight (${barWeight}${unit})`
                      : `Closest possible: ${totalWeight}${unit}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isValid && calculation.length > 0 ? (
                  <div className="space-y-4">
                    {/* Visual representation */}
                    <PlateVisualization plates={calculation} />

                    {/* Plate breakdown */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Plates per side:</h4>
                      {calculation.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: item.plate.color }}
                            />
                            <span>
                              {item.plate.weight}
                              {unit}
                            </span>
                          </div>
                          <span className="font-medium">
                            {item.count} plate{item.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : calculation.length === 0 &&
                  targetWeight &&
                  parseFloat(targetWeight) >= barWeight ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Just the barbell - no plates needed!
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Plate Color Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {plates.map((plate) => (
                  <div key={plate.weight} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: plate.color }}
                    />
                    <span className="text-sm">
                      {plate.weight}
                      {unit}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Based on standard Olympic weightlifting plate colors and
                availability
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
