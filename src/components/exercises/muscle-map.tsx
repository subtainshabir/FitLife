"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

export interface MuscleMapProps {
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  selectedMuscle?: string;
  onSelectMuscle?: (muscleSlug: string) => void;
  viewMode?: "both" | "front" | "back";
  interactive?: boolean;
  className?: string;
}

interface MuscleInfo {
  slug: string;
  nameEn: string;
  nameUr: string;
  region: "upper" | "lower" | "core";
}

const MUSCLE_DEFINITIONS: Record<string, MuscleInfo> = {
  chest: { slug: "chest", nameEn: "Chest (Pectorals)", nameUr: "سینہ (سینے کے پٹھے)", region: "upper" },
  back: { slug: "back", nameEn: "Back (Lats & Rhomboids)", nameUr: "کمر (پشت کے پٹھے)", region: "upper" },
  shoulders: { slug: "shoulders", nameEn: "Shoulders (Deltoids)", nameUr: "کندھے (ڈیلٹائیڈز)", region: "upper" },
  biceps: { slug: "biceps", nameEn: "Biceps", nameUr: "بائسپس (بازو کے اگلے پٹھے)", region: "upper" },
  triceps: { slug: "triceps", nameEn: "Triceps", nameUr: "ٹرائسپس (بازو کے پچھلے پٹھے)", region: "upper" },
  forearms: { slug: "forearms", nameEn: "Forearms", nameUr: "کلائی اور بازو", region: "upper" },
  abdominals: { slug: "abdominals", nameEn: "Abdominals & Core", nameUr: "پیٹ اور کور (ایبز)", region: "core" },
  quadriceps: { slug: "quadriceps", nameEn: "Quadriceps (Quads)", nameUr: "ران کے اگلے پٹھے", region: "lower" },
  hamstrings: { slug: "hamstrings", nameEn: "Hamstrings", nameUr: "ران کے پچھلے پٹھے", region: "lower" },
  glutes: { slug: "glutes", nameEn: "Glutes (Gluteal)", nameUr: "کولہے کے پٹھے", region: "lower" },
  calves: { slug: "calves", nameEn: "Calves", nameUr: "پنڈلی کے پٹھے", region: "lower" },
  full_body: { slug: "full_body", nameEn: "Full Body Integration", nameUr: "پورے جسم کے پٹھے", region: "core" },
};

export function MuscleMap({
  primaryMuscle,
  secondaryMuscles = [],
  selectedMuscle,
  onSelectMuscle,
  viewMode = "both",
  interactive = true,
  className = "",
}: MuscleMapProps) {
  const { isRtl } = useI18n();
  const [activeTab, setActiveTab] = useState<"front" | "back">("front");
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const normPrimary = (primaryMuscle || "").toLowerCase();
  const normSecondaries = secondaryMuscles.map((m) => m.toLowerCase());
  const normSelected = (selectedMuscle || "").toLowerCase();

  const getMuscleFill = (muscleSlug: string): string => {
    const slug = muscleSlug.toLowerCase();
    const isPrimary = normPrimary === slug;
    const isSecondary = normSecondaries.includes(slug);
    const isCurrentSelected = normSelected === slug;
    const isHovered = hoveredMuscle === slug;

    if (isPrimary) {
      return "fill-emerald-500 stroke-emerald-600 dark:fill-emerald-400 dark:stroke-emerald-300 filter drop-shadow(0 0 6px rgba(16,185,129,0.6))";
    }
    if (isCurrentSelected) {
      return "fill-cyan-500 stroke-cyan-600 dark:fill-cyan-400 dark:stroke-cyan-300 filter drop-shadow(0 0 6px rgba(6,182,212,0.6))";
    }
    if (isSecondary) {
      return "fill-teal-400 stroke-teal-500 dark:fill-teal-500 dark:stroke-teal-400 filter drop-shadow(0 0 4px rgba(20,184,166,0.5))";
    }
    if (isHovered && interactive) {
      return "fill-emerald-300 dark:fill-emerald-600 stroke-emerald-400 transition-all cursor-pointer";
    }
    return "fill-slate-200 dark:fill-slate-800/80 stroke-slate-300 dark:stroke-slate-700/80 transition-colors";
  };

  const handleMuscleClick = (slug: string) => {
    if (interactive && onSelectMuscle) {
      onSelectMuscle(slug);
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* View Toggle for Compact Mode */}
      {viewMode === "both" && (
        <div className="flex md:hidden items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("front")}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              activeTab === "front"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("back")}
            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
              activeTab === "back"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Posterior (Back)
          </button>
        </div>
      )}

      {/* Interactive Anatomy Canvas */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        {/* FRONT ANATOMY VIEW */}
        {(viewMode === "both" ? activeTab === "front" || true : viewMode === "front") && (
          <div
            className={`flex flex-col items-center ${
              viewMode === "both" ? "hidden md:flex" : "flex"
            } ${viewMode === "both" && activeTab === "front" ? "!flex" : ""}`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
              Anterior (Front)
            </span>
            <div className="relative p-2 rounded-3xl bg-card/60 border border-border/70 shadow-sm backdrop-blur-sm">
              <svg
                viewBox="0 0 200 400"
                className="w-36 sm:w-44 h-72 sm:h-88 transition-transform"
                style={{ strokeWidth: 1.5, strokeLinejoin: "round" }}
              >
                {/* Silhouette Outlines */}
                {/* Head */}
                <ellipse cx="100" cy="30" rx="18" ry="22" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />
                {/* Neck */}
                <path d="M92 50 L92 65 L108 65 L108 50 Z" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />

                {/* 1. Shoulders (Deltoids Anterior) */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("shoulders")}
                  onMouseEnter={() => setHoveredMuscle("shoulders")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M72 65 C60 68 50 82 52 98 C58 98 68 85 74 78 Z" className={getMuscleFill("shoulders")} />
                  <path d="M128 65 C140 68 150 82 148 98 C142 98 132 85 126 78 Z" className={getMuscleFill("shoulders")} />
                </g>

                {/* 2. Chest (Pectoralis Major) */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("chest")}
                  onMouseEnter={() => setHoveredMuscle("chest")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M74 72 C85 70 98 75 98 102 C85 106 72 98 68 88 C70 80 74 74 74 72 Z" className={getMuscleFill("chest")} />
                  <path d="M126 72 C115 70 102 75 102 102 C115 106 128 98 132 88 C130 80 126 74 126 72 Z" className={getMuscleFill("chest")} />
                </g>

                {/* 3. Biceps */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("biceps")}
                  onMouseEnter={() => setHoveredMuscle("biceps")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <ellipse cx="50" cy="116" rx="8" ry="16" className={getMuscleFill("biceps")} />
                  <ellipse cx="150" cy="116" rx="8" ry="16" className={getMuscleFill("biceps")} />
                </g>

                {/* 4. Forearms */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("forearms")}
                  onMouseEnter={() => setHoveredMuscle("forearms")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M42 136 C40 148 38 165 42 178 C46 178 52 165 54 148 C50 140 45 136 42 136 Z" className={getMuscleFill("forearms")} />
                  <path d="M158 136 C160 148 162 165 158 178 C154 178 148 165 146 148 C150 140 155 136 158 136 Z" className={getMuscleFill("forearms")} />
                </g>

                {/* 5. Abdominals (Rectus & Obliques) */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("abdominals")}
                  onMouseEnter={() => setHoveredMuscle("abdominals")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  {/* Upper Abs */}
                  <rect x="86" y="106" width="12" height="12" rx="2" className={getMuscleFill("abdominals")} />
                  <rect x="102" y="106" width="12" height="12" rx="2" className={getMuscleFill("abdominals")} />
                  {/* Mid Abs */}
                  <rect x="86" y="121" width="12" height="12" rx="2" className={getMuscleFill("abdominals")} />
                  <rect x="102" y="121" width="12" height="12" rx="2" className={getMuscleFill("abdominals")} />
                  {/* Lower Abs */}
                  <path d="M86 136 L114 136 L108 160 L92 160 Z" className={getMuscleFill("abdominals")} />
                  {/* Obliques */}
                  <path d="M72 110 C70 125 72 145 76 156 L83 156 L83 110 Z" className={getMuscleFill("abdominals")} />
                  <path d="M128 110 C130 125 128 145 124 156 L117 156 L117 110 Z" className={getMuscleFill("abdominals")} />
                </g>

                {/* Pelvis Area */}
                <path d="M82 160 L118 160 L109 184 L91 184 Z" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />

                {/* 6. Quadriceps */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("quadriceps")}
                  onMouseEnter={() => setHoveredMuscle("quadriceps")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M74 186 C68 200 68 230 76 262 C82 262 89 235 91 190 Z" className={getMuscleFill("quadriceps")} />
                  <path d="M126 186 C132 200 132 230 124 262 C118 262 111 235 109 190 Z" className={getMuscleFill("quadriceps")} />
                </g>

                {/* Knees */}
                <circle cx="80" cy="272" r="6" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />
                <circle cx="120" cy="272" r="6" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />

                {/* 7. Calves / Shins */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("calves")}
                  onMouseEnter={() => setHoveredMuscle("calves")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M74 282 C68 295 68 325 76 355 L84 355 C88 325 86 295 84 282 Z" className={getMuscleFill("calves")} />
                  <path d="M126 282 C132 295 132 325 124 355 L116 355 C112 325 114 295 116 282 Z" className={getMuscleFill("calves")} />
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* BACK ANATOMY VIEW */}
        {(viewMode === "both" ? activeTab === "back" || true : viewMode === "back") && (
          <div
            className={`flex flex-col items-center ${
              viewMode === "both" ? "hidden md:flex" : "flex"
            } ${viewMode === "both" && activeTab === "back" ? "!flex" : ""}`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
              Posterior (Back)
            </span>
            <div className="relative p-2 rounded-3xl bg-card/60 border border-border/70 shadow-sm backdrop-blur-sm">
              <svg
                viewBox="0 0 200 400"
                className="w-36 sm:w-44 h-72 sm:h-88 transition-transform"
                style={{ strokeWidth: 1.5, strokeLinejoin: "round" }}
              >
                {/* Head Back */}
                <ellipse cx="100" cy="30" rx="18" ry="22" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />

                {/* Trapezius & Upper Back */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("back")}
                  onMouseEnter={() => setHoveredMuscle("back")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  {/* Traps */}
                  <path d="M88 52 L112 52 L128 66 L100 102 L72 66 Z" className={getMuscleFill("back")} />
                  {/* Latissimus Dorsi */}
                  <path d="M72 74 C60 90 62 125 78 148 L100 148 L100 102 Z" className={getMuscleFill("back")} />
                  <path d="M128 74 C140 90 138 125 122 148 L100 148 L100 102 Z" className={getMuscleFill("back")} />
                </g>

                {/* Rear Deltoids */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("shoulders")}
                  onMouseEnter={() => setHoveredMuscle("shoulders")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M68 68 C56 72 48 85 52 98 C56 94 65 82 72 76 Z" className={getMuscleFill("shoulders")} />
                  <path d="M132 68 C144 72 152 85 148 98 C144 94 135 82 128 76 Z" className={getMuscleFill("shoulders")} />
                </g>

                {/* Triceps */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("triceps")}
                  onMouseEnter={() => setHoveredMuscle("triceps")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <ellipse cx="48" cy="116" rx="7" ry="16" className={getMuscleFill("triceps")} />
                  <ellipse cx="152" cy="116" rx="7" ry="16" className={getMuscleFill("triceps")} />
                </g>

                {/* Forearms Back */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("forearms")}
                  onMouseEnter={() => setHoveredMuscle("forearms")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M42 136 C38 148 38 165 42 178 C46 178 52 165 54 148 C50 140 45 136 42 136 Z" className={getMuscleFill("forearms")} />
                  <path d="M158 136 C162 148 162 165 158 178 C154 178 148 165 146 148 C150 140 155 136 158 136 Z" className={getMuscleFill("forearms")} />
                </g>

                {/* Lower Back / Erector Spinae */}
                <path d="M82 148 L118 148 L114 165 L86 165 Z" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" />

                {/* 8. Glutes */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("glutes")}
                  onMouseEnter={() => setHoveredMuscle("glutes")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M72 166 C70 180 72 205 98 206 L98 166 Z" className={getMuscleFill("glutes")} />
                  <path d="M128 166 C130 180 128 205 102 206 L102 166 Z" className={getMuscleFill("glutes")} />
                </g>

                {/* 9. Hamstrings */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("hamstrings")}
                  onMouseEnter={() => setHoveredMuscle("hamstrings")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M72 208 C68 225 68 245 76 264 C82 264 92 245 96 208 Z" className={getMuscleFill("hamstrings")} />
                  <path d="M128 208 C132 225 132 245 124 264 C118 264 108 245 104 208 Z" className={getMuscleFill("hamstrings")} />
                </g>

                {/* 10. Calves (Gastrocnemius & Soleus) */}
                <g
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => handleMuscleClick("calves")}
                  onMouseEnter={() => setHoveredMuscle("calves")}
                  onMouseLeave={() => setHoveredMuscle(null)}
                >
                  <path d="M74 278 C66 295 66 325 76 355 L84 355 C90 325 88 295 84 278 Z" className={getMuscleFill("calves")} />
                  <path d="M126 278 C134 295 134 325 124 355 L116 355 C110 325 112 295 116 278 Z" className={getMuscleFill("calves")} />
                </g>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Hovered / Active Muscle Indicator Banner */}
      <div className="mt-4 text-center min-h-[36px] flex flex-col items-center justify-center">
        {hoveredMuscle && MUSCLE_DEFINITIONS[hoveredMuscle] ? (
          <div className="flex items-center gap-2 animate-in fade-in">
            <span className="text-xs font-black text-foreground">
              {MUSCLE_DEFINITIONS[hoveredMuscle].nameEn}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-urdu" dir="rtl">
              {MUSCLE_DEFINITIONS[hoveredMuscle].nameUr}
            </span>
          </div>
        ) : (
          primaryMuscle && MUSCLE_DEFINITIONS[normPrimary] ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                Primary Target: {MUSCLE_DEFINITIONS[normPrimary].nameEn}
              </Badge>
              {normSecondaries.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 border-teal-500/30">
                  Secondary: {normSecondaries.map((s) => MUSCLE_DEFINITIONS[s]?.nameEn || s).join(", ")}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {interactive ? "Hover or tap any muscle group to explore targeted exercises" : "Anatomical muscle engagement guide"}
            </span>
          )
        )}
      </div>

      {/* Visual Color Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-border/40 text-[10px] text-muted-foreground font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>Primary Muscle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
          <span>Secondary Muscle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>Inactive / Stabilizing</span>
        </div>
      </div>
    </div>
  );
}

