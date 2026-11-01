"use client";

import React from "react";
import { Apple, Flame, Sparkles, AlertCircle } from "lucide-react";

interface MacroItem {
  grams: number;
  calories: number;
  percentage: number;
}

interface MacroBreakdownProps {
  dailyCalories: number;
  protein: MacroItem;
  carbs: MacroItem;
  fat: MacroItem;
  disclaimer?: string;
  isRestrictedFloor?: boolean;
}

export function MacroBreakdown({
  dailyCalories,
  protein,
  carbs,
  fat,
  disclaimer,
  isRestrictedFloor = false,
}: MacroBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* Daily Calories Highlight */}
      <div className="flex flex-col xs:flex-row xs:items-baseline justify-between gap-2">
        <div>
          <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-muted-foreground block">
            Target Energy Intake
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {dailyCalories.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-muted-foreground">kcal / day</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold self-start xs:self-auto">
          <Flame className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Evidence-Based</span>
        </div>
      </div>

      {/* Visual Multi-Segment Macro Ratio Bar */}
      <div className="space-y-1.5">
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted shadow-inner">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${protein.percentage}%` }}
            title={`Protein: ${protein.grams}g (${protein.percentage}%)`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${carbs.percentage}%` }}
            title={`Carbs: ${carbs.grams}g (${carbs.percentage}%)`}
          />
          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${fat.percentage}%` }}
            title={`Fat: ${fat.grams}g (${fat.percentage}%)`}
          />
        </div>

        {/* Macro Ratio Labels */}
        <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-muted-foreground px-0.5">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Protein {protein.percentage}%</span>
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 truncate">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Carbs {carbs.percentage}%</span>
          </span>
          <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 truncate">
            <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
            <span className="truncate">Fat {fat.percentage}%</span>
          </span>
        </div>
      </div>

      {/* Detailed Macro Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1">
        {/* Protein Card */}
        <div className="rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2 sm:p-3 text-start min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block truncate">
            Protein
          </span>
          <div className="flex items-baseline gap-0.5 sm:gap-1 mt-1">
            <span className="text-lg sm:text-2xl font-black text-foreground truncate">{protein.grams}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">g</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block mt-0.5 truncate">
            {protein.calories} kcal
          </span>
        </div>

        {/* Carbohydrates Card */}
        <div className="rounded-xl sm:rounded-2xl border border-amber-500/20 bg-amber-500/5 p-2 sm:p-3 text-start min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block truncate">
            Carbs
          </span>
          <div className="flex items-baseline gap-0.5 sm:gap-1 mt-1">
            <span className="text-lg sm:text-2xl font-black text-foreground truncate">{carbs.grams}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">g</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block mt-0.5 truncate">
            {carbs.calories} kcal
          </span>
        </div>

        {/* Fat Card */}
        <div className="rounded-xl sm:rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-2 sm:p-3 text-start min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block truncate">
            Fats
          </span>
          <div className="flex items-baseline gap-0.5 sm:gap-1 mt-1">
            <span className="text-lg sm:text-2xl font-black text-foreground truncate">{fat.grams}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">g</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block mt-0.5 truncate">
            {fat.calories} kcal
          </span>
        </div>
      </div>

      {/* Safety Floor Notice */}
      {isRestrictedFloor && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            Safety Floor Active: Calories were locked to your physiological minimum floor to avoid metabolic disruption and nutrient deficits.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {disclaimer ||
          "Target Notice: Calculated macro distributions are evidence-based initial estimates. Adjust intake based on energy levels and progressive weekly scale feedback. No meal plans are generated in this phase."}
      </p>
    </div>
  );
}

