"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface WeightPoint {
  date: string;
  weightKg: number;
  weightLbs: number;
  movingAvgKg?: number;
  targetWeightKg?: number | null;
  startWeightKg?: number | null;
  notes?: string | null;
}

interface WeightChartProps {
  data: WeightPoint[];
  targetWeightKg?: number | null;
  startWeightKg?: number | null;
  unit?: "kg" | "lbs";
  isRtl?: boolean;
}

export function WeightChart({
  data,
  targetWeightKg,
  startWeightKg,
  unit = "kg",
  isRtl = false,
}: WeightChartProps) {
  const [mounted, setMounted] = useState(false);
  const [showMovingAvg, setShowMovingAvg] = useState(true);

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
          {isRtl ? "وزن کا کوئی ریکارڈ موجود نہیں ہے۔" : "No weight entries recorded yet."}
        </p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          {isRtl ? "چارٹ دیکھنے کے لیے نیا وزن درج کریں۔" : "Log your first weight entry above to visualize trends."}
        </p>
      </div>
    );
  }

  const isLbs = unit === "lbs";
  const displayData = data.map((d) => ({
    ...d,
    displayWeight: isLbs ? d.weightLbs : d.weightKg,
    displayMovingAvg: d.movingAvgKg ? (isLbs ? Math.round(d.movingAvgKg * 2.20462 * 10) / 10 : d.movingAvgKg) : undefined,
  }));

  const displayTarget = targetWeightKg
    ? isLbs
      ? Math.round(targetWeightKg * 2.20462 * 10) / 10
      : targetWeightKg
    : null;

  const displayStart = startWeightKg
    ? isLbs
      ? Math.round(startWeightKg * 2.20462 * 10) / 10
      : startWeightKg
    : null;

  // Compute domain bounds with safe padding
  const values = displayData.map((d) => d.displayWeight);
  if (displayTarget) values.push(displayTarget);
  if (displayStart) values.push(displayStart);

  const minVal = Math.floor(Math.min(...values) - 2);
  const maxVal = Math.ceil(Math.max(...values) + 2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showMovingAvg ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowMovingAvg(!showMovingAvg)}
            className="text-xs h-7 rounded-lg"
          >
            {isRtl ? "7 روزہ اوسط لائن" : "7-Day Moving Avg"}
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {displayTarget && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                {isRtl ? "ہدف:" : "Target:"} {displayTarget} {unit}
              </span>
            </div>
          )}
          {displayStart && (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>
                {isRtl ? "ابتدائی:" : "Start:"} {displayStart} {unit}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              domain={[minVal, maxVal]}
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
                    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1">
                      <div className="font-bold text-foreground">{pt.date}</div>
                      <div className="text-emerald-500 font-semibold">
                        {isRtl ? "وزن:" : "Weight:"} {pt.displayWeight} {unit}
                      </div>
                      {pt.displayMovingAvg && (
                        <div className="text-cyan-500 text-[11px]">
                          {isRtl ? "اوسط:" : "Moving Avg:"} {pt.displayMovingAvg} {unit}
                        </div>
                      )}
                      {pt.notes && (
                        <div className="text-muted-foreground text-[10px] italic max-w-xs truncate">
                          "{pt.notes}"
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {displayTarget && (
              <ReferenceLine
                y={displayTarget}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `${isRtl ? "ہدف" : "Target"} (${displayTarget})`,
                  fill: "#10b981",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}
            {displayStart && (
              <ReferenceLine
                y={displayStart}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: `${isRtl ? "ابتدائی" : "Start"} (${displayStart})`,
                  fill: "#94a3b8",
                  fontSize: 10,
                  position: "insideBottomRight",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="displayWeight"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#weightGrad)"
              activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            />
            {showMovingAvg && (
              <Line
                type="monotone"
                dataKey="displayMovingAvg"
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
