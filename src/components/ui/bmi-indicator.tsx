"use client";

import React from "react";
import { AlertCircle, Info, ShieldAlert, Sparkles } from "lucide-react";

interface BmiIndicatorProps {
  bmi: number;
  category: string;
  isMinor?: boolean;
  disclaimer?: string;
  explanation?: string;
}

export function BmiIndicator({
  bmi,
  category,
  isMinor = false,
  disclaimer,
  explanation,
}: BmiIndicatorProps) {
  // Clamp BMI for indicator bar positioning between 14 and 42
  const minRange = 14;
  const maxRange = 42;
  const clampedBmi = Math.max(minRange, Math.min(bmi, maxRange));
  const percentage = Math.round(((clampedBmi - minRange) / (maxRange - minRange)) * 100);

  const getCategoryDetails = () => {
    if (isMinor) {
      return {
        label: "Pediatric / Minor (<18)",
        color: "text-sky-500",
        badgeBg: "bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400",
      };
    }
    if (bmi < 18.5) {
      return {
        label: "Underweight (< 18.5)",
        color: "text-blue-500",
        badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400",
      };
    }
    if (bmi < 25.0) {
      return {
        label: "Normal Weight (18.5 - 24.9)",
        color: "text-emerald-500",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      };
    }
    if (bmi < 30.0) {
      return {
        label: "Overweight (25.0 - 29.9)",
        color: "text-amber-500",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
      };
    }
    if (bmi < 35.0) {
      return {
        label: "Obesity Class I (30.0 - 34.9)",
        color: "text-orange-500",
        badgeBg: "bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400",
      };
    }
    return {
      label: "Obesity Class II/III (≥ 35.0)",
      color: "text-rose-500",
      badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400",
    };
  };

  const info = getCategoryDetails();

  return (
    <div className="space-y-4">
      {/* Top Value Display */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground block">
            Calculated BMI
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-4xl font-black tracking-tight text-foreground">{bmi}</span>
            <span className="text-xs font-semibold text-muted-foreground">kg/m²</span>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${info.badgeBg}`}>
          <Sparkles className="h-3.5 w-3.5" />
          <span>{info.label}</span>
        </span>
      </div>

      {/* Graphical Scale / Meter Bar */}
      <div className="relative pt-6 pb-2">
        {/* Needle Pointer */}
        <div
          className="absolute top-0 transform -translate-x-1/2 transition-all duration-700 ease-out z-10 flex flex-col items-center"
          style={{ left: `${percentage}%` }}
        >
          <span className="text-[10px] font-black bg-foreground text-background px-1.5 py-0.5 rounded shadow">
            {bmi}
          </span>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-foreground -mt-0.5" />
        </div>

        {/* Multi-segmented Gradient Track */}
        <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner bg-muted">
          <div className="h-full bg-blue-500 w-[16%]" title="Underweight (<18.5)" />
          <div className="h-full bg-emerald-500 w-[23%]" title="Normal (18.5-24.9)" />
          <div className="h-full bg-amber-500 w-[18%]" title="Overweight (25-29.9)" />
          <div className="h-full bg-orange-500 w-[18%]" title="Obesity Class I (30-34.9)" />
          <div className="h-full bg-rose-500 flex-1" title="Obesity Class II+ (≥35)" />
        </div>

        {/* Legend / Range labels */}
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2 px-1">
          <span>&lt;18.5 (Under)</span>
          <span>18.5 - 24.9 (Normal)</span>
          <span>25 - 29.9 (Over)</span>
          <span>30+ (Obese)</span>
        </div>
      </div>

      {/* Minor Safeguard Alert */}
      {isMinor && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-200">
          <ShieldAlert className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Pediatric Screening Safeguard:</span>
            <span>
              Standard adult BMI classification is not clinically used for individuals under 18 years. Age-and-sex-specific CDC/WHO growth percentiles must be used with pediatric guidance.
            </span>
          </div>
        </div>
      )}

      {/* Screening Explanations and Disclaimers */}
      {explanation && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {explanation}
        </p>
      )}

      <div className="rounded-xl border border-border/80 bg-muted/40 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p>
          {disclaimer ||
            "Screening Disclaimer: BMI is a population-level screening metric. It does not measure body fat directly and may overestimate adiposity in muscular athletes or underestimate it in older adults."}
        </p>
      </div>
    </div>
  );
}

