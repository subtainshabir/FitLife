"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dumbbell, Flame, ChevronRight, Activity, ShieldCheck, Zap } from "lucide-react";

export interface ExerciseItemProps {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  descriptionEn: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  trainingType: string;
  difficulty: string;
  equipment: string;
  isBodyweight: boolean;
  estimatedCaloriesPerMinute?: number | null;
  thumbnailUrl?: string | null;
  categoryNameEn?: string | null;
  categorySlug?: string | null;
  primaryMuscleNameEn?: string | null;
  primaryMuscleNameUr?: string | null;
}

export function ExerciseCard({ exercise }: { exercise: ExerciseItemProps }) {
  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold uppercase">
            Beginner
          </Badge>
        );
      case "intermediate":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] font-extrabold uppercase">
            Intermediate
          </Badge>
        );
      case "advanced":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] font-extrabold uppercase">
            Advanced
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[9px]">{diff}</Badge>;
    }
  };

  const formatEquipment = (eq: string) => {
    switch (eq.toLowerCase()) {
      case "none":
        return "Bodyweight / No Equipment";
      case "dumbbells":
        return "Dumbbells";
      case "barbell":
        return "Barbell";
      case "cable":
        return "Cable Machine";
      case "machine":
        return "Gym Machine";
      case "pull_up_bar":
        return "Pull-Up Bar";
      case "resistance_band":
        return "Resistance Band";
      case "cardio_machine":
        return "Cardio Equipment";
      default:
        return eq.replace(/_/g, " ");
    }
  };

  return (
    <Link href={`/exercises/${exercise.slug || exercise.id}`} className="group block h-full">
      <Card className="rounded-3xl border border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all h-full flex flex-col justify-between overflow-hidden">
        {/* Visual Header / Thumbnail Art */}
        <div className="relative h-44 sm:h-48 w-full bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-4 flex flex-col justify-between overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 end-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Badges */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 backdrop-blur-md border border-white/10">
              {exercise.categoryNameEn || exercise.trainingType}
            </span>
            {getDifficultyBadge(exercise.difficulty)}
          </div>

          {/* Central Anatomical Icon Representation */}
          <div className="relative z-10 flex items-center justify-center py-2">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-inner shadow-black/40">
              <Dumbbell className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>

          {/* Bottom Bar inside Card Art */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300 font-semibold">
            <span className="capitalize">{formatEquipment(exercise.equipment)}</span>
            {exercise.estimatedCaloriesPerMinute && (
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Flame className="h-3 w-3 fill-amber-400/30" />
                ~{exercise.estimatedCaloriesPerMinute} kcal/min
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-extrabold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-1">
                {exercise.nameEn}
              </h3>
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-urdu line-clamp-1" dir="rtl">
              {exercise.nameUr}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
              {exercise.descriptionEn}
            </p>
          </div>

          {/* Footer Details */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Target:</span>
              <Badge variant="outline" className="text-[10px] font-bold text-foreground capitalize">
                {exercise.primaryMuscleNameEn || exercise.primaryMuscle}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>View Guide</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

