"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MeasurementPoint {
  date: string;
  waistCm?: number | null;
  chestCm?: number | null;
  hipCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  neckCm?: number | null;
  bodyFatPercentage?: number | null;
  waistIn?: number | null;
  chestIn?: number | null;
  armIn?: number | null;
  hipIn?: number | null;
}

interface MeasurementsChartProps {
  data: MeasurementPoint[];
  unit?: "cm" | "in";
  isRtl?: boolean;
}

const METRIC_CONFIGS = [
  { key: "waist", labelEn: "Waist", labelUr: "کمر", color: "#10b981" },
  { key: "chest", labelEn: "Chest", labelUr: "سینہ", color: "#06b6d4" },
  { key: "arm", labelEn: "Arms", labelUr: "بازو", color: "#f59e0b" },
  { key: "hip", labelEn: "Hips", labelUr: "کولہے", color: "#8b5cf6" },
  { key: "thigh", labelEn: "Thighs", labelUr: "رانیں", color: "#ec4899" },
  { key: "bodyFat", labelEn: "Body Fat %", labelUr: "چربی %", color: "#ef4444" },
];

export function MeasurementsChart({
  data,
  unit = "cm",
  isRtl = false,
}: MeasurementsChartProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["waist", "chest", "arm"]);

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

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-muted/20 border border-border/50 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {isRtl ? "پیمائش کا کوئی ریکارڈ موجود نہیں ہے۔" : "No circumference records found."}
        </p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          {isRtl ? "پہلی پیمائش درج کریں تاکہ تبدیلی کا چارٹ دیکھا جا سکے۔" : "Log waist, chest, or arm measurements to start tracking trends."}
        </p>
      </div>
    );
  }

  const isImperial = unit === "in";

  const chartData = data.map((d) => ({
    date: d.date,
    waist: isImperial ? d.waistIn : d.waistCm,
    chest: isImperial ? d.chestIn : d.chestCm,
    arm: isImperial ? d.armIn : d.armCm,
    hip: isImperial ? d.hipIn : d.hipCm,
    thigh: d.thighCm ? (isImperial ? Math.round((d.thighCm / 2.54) * 10) / 10 : d.thighCm) : null,
    bodyFat: d.bodyFatPercentage,
  }));

  const toggleMetric = (key: string) => {
    if (selectedMetrics.includes(key)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((m) => m !== key));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, key]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Selectors */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground me-1">
          {isRtl ? "پیمائش منتخب کریں:" : "Toggle Metrics:"}
        </span>
        {METRIC_CONFIGS.map((cfg) => {
          const isSelected = selectedMetrics.includes(cfg.key);
          return (
            <button
              key={cfg.key}
              type="button"
              onClick={() => toggleMetric(cfg.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-card shadow-sm border-border text-foreground font-bold"
                  : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              <span>{isRtl ? cfg.labelUr : cfg.labelEn}</span>
            </button>
          );
        })}
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
              tickFormatter={(val) => {
                const parts = val.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
              unit={` ${unit}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as any;
                  return (
                    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1.5 min-w-[140px]">
                      <div className="font-bold text-foreground border-b border-border/50 pb-1">
                        {pt.date}
                      </div>
                      {METRIC_CONFIGS.filter((c) => selectedMetrics.includes(c.key)).map((c) => {
                        const val = pt[c.key];
                        if (val === null || val === undefined) return null;
                        const metricUnit = c.key === "bodyFat" ? "%" : unit;
                        return (
                          <div key={c.key} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                              {isRtl ? c.labelUr : c.labelEn}:
                            </span>
                            <span className="font-bold text-foreground">
                              {val} {metricUnit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            {METRIC_CONFIGS.filter((c) => selectedMetrics.includes(c.key)).map((c) => (
              <Line
                key={c.key}
                type="monotone"
                dataKey={c.key}
                name={isRtl ? c.labelUr : c.labelEn}
                stroke={c.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: c.color }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
