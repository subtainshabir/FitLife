"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Loader2, Dumbbell, Utensils } from "lucide-react";

interface WorkoutPoint {
  date: string;
  volumeKg: number;
  durationMinutes: number;
  rating?: number | null;
  isCompleted: boolean;
}

interface NutritionPoint {
  date: string;
  calories: number;
  targetCalories: number;
  proteinGrams: number;
  targetProteinGrams: number;
}

interface AnalyticsChartsProps {
  workoutData: WorkoutPoint[];
  nutritionData: NutritionPoint[];
  isRtl?: boolean;
}

export function AnalyticsCharts({
  workoutData,
  nutritionData,
  isRtl = false,
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-muted/20 border border-border/50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Workout Volume Trend */}
      <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isRtl ? "ورزش کا والیوم اور سیشنز" : "Workout Training Volume"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "ہر سیشن کا مجموعی وزن (کلوگرام)" : "Total weight moved per workout session (kg)"}
              </p>
            </div>
          </div>
        </div>

        {workoutData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 rounded-2xl bg-muted/20 text-center p-4">
            <p className="text-xs text-muted-foreground">
              {isRtl ? "اس مدت میں کوئی مکمل شدہ ورزش ریکارڈ نہیں ہے۔" : "No completed workouts in this period."}
            </p>
          </div>
        ) : (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                  tickFormatter={(val) => {
                    const parts = val.split("-");
                    return `${parts[1]}/${parts[2]}`;
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                  unit=" kg"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload as WorkoutPoint;
                      return (
                        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                          <div className="font-bold text-foreground">{pt.date}</div>
                          <div className="text-cyan-500 font-semibold">
                            {isRtl ? "والیوم:" : "Volume:"} {pt.volumeKg.toLocaleString()} kg
                          </div>
                          {pt.durationMinutes > 0 && (
                            <div className="text-muted-foreground text-[11px]">
                              {isRtl ? "وقت:" : "Duration:"} {pt.durationMinutes} min
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="volumeKg"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Nutrition Consistency */}
      <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isRtl ? "غذائی ہدف اور کیلوریز کا تسلسل" : "Calorie Intake vs Target"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRtl ? "روزانہ خوراک اور مطلوبہ کیلوریز کا موازنہ" : "Actual consumed calories vs daily target"}
              </p>
            </div>
          </div>
        </div>

        {nutritionData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 rounded-2xl bg-muted/20 text-center p-4">
            <p className="text-xs text-muted-foreground">
              {isRtl ? "اس مدت میں خوراک کی ڈائری کا کوئی ریکارڈ موجود نہیں ہے۔" : "No nutrition diary logs in this period."}
            </p>
          </div>
        ) : (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nutritionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                  tickFormatter={(val) => {
                    const parts = val.split("-");
                    return `${parts[1]}/${parts[2]}`;
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }}
                  unit=" kcal"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload as NutritionPoint;
                      return (
                        <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                          <div className="font-bold text-foreground">{pt.date}</div>
                          <div className="text-emerald-500 font-semibold">
                            {isRtl ? "کھائی گئیں:" : "Consumed:"} {pt.calories} kcal
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {isRtl ? "ہدف:" : "Target:"} {pt.targetCalories} kcal
                          </div>
                          <div className="text-amber-500 text-[11px]">
                            {isRtl ? "پروٹین:" : "Protein:"} {pt.proteinGrams}g / {pt.targetProteinGrams}g
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="targetCalories"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

