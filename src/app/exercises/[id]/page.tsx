"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { ExerciseCard, ExerciseItemProps } from "@/components/exercises/exercise-card";
import {
  Dumbbell,
  ArrowLeft,
  Flame,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Wind,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Clock,
  Compass,
  Activity,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface ExerciseDetailData {
  id: string;
  slug: string;
  nameEn: string;
  nameUr: string;
  descriptionEn: string;
  descriptionUr: string;
  categoryId: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameUr: string;
  primaryMuscleId: string;
  primaryMuscle: string;
  primaryMuscleNameEn: string;
  primaryMuscleNameUr: string;
  secondaryMuscles: string[];
  trainingType: string;
  exerciseType: string;
  difficulty: string;
  equipment: string;
  movementPattern: string;
  isBodyweight: boolean;
  startingPositionEn: string;
  startingPositionUr: string;
  executionStepsEn: string[];
  executionStepsUr: string[];
  breathingPatternEn: string;
  breathingPatternUr: string;
  safetyPrecautionsEn: string[];
  safetyPrecautionsUr: string[];
  commonMistakesEn: string[];
  commonMistakesUr: string[];
  easierVariation?: string | null;
  harderVariation?: string | null;
  estimatedMetValue?: number | null;
  estimatedCaloriesPerMinute?: number | null;
  demoMediaUrl?: string | null;
  thumbnailUrl?: string | null;
  mediaType?: string | null;
  mediaAttribution?: string | null;
  isVerified: boolean;
}

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, isRtl, language } = useI18n();

  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<ExerciseDetailData | null>(null);
  const [relatedList, setRelatedList] = useState<ExerciseItemProps[]>([]);
  const [alternativesList, setAlternativesList] = useState<ExerciseItemProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadExerciseData() {
      setLoading(true);
      setError(null);
      try {
        const [detailRes, relatedRes, altRes] = await Promise.all([
          fetch(`/api/v1/exercises/${id}`),
          fetch(`/api/v1/exercises/${id}/related`),
          fetch(`/api/v1/exercises/${id}/alternatives`),
        ]);

        if (!detailRes.ok) {
          throw new Error("Exercise not found or invalid ID.");
        }

        const dData = await detailRes.json();
        setExercise(dData.exercise);

        if (relatedRes.ok) {
          const rData = await relatedRes.json();
          setRelatedList(rData.related || []);
        }

        if (altRes.ok) {
          const aData = await altRes.json();
          setAlternativesList(aData.alternatives || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load exercise details.");
      } finally {
        setLoading(false);
      }
    }

    loadExerciseData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardNav />
        <main className="flex-1 flex flex-col items-center justify-center py-24">
          <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            Loading anatomical movement breakdown...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardNav />
        <main className="flex-1 container mx-auto px-4 py-16 text-center max-w-lg">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-bold text-foreground mb-2">Exercise Not Found</h2>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            {error || "The requested movement does not exist in the FitLife AI Exercise Library."}
          </p>
          <Link href="/exercises">
            <Button variant="default" size="sm" className="rounded-xl text-xs font-bold">
              <ArrowLeft className="h-4 w-4 me-1.5" />
              <span>Back to Library</span>
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

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
    <div className="flex min-h-screen flex-col bg-background selection:bg-emerald-500/20">
      <DashboardNav />

      <main className="flex-1 pb-24 md:pb-16">
        {/* Top Breadcrumb & Title Banner */}
        <section className="border-b border-border/80 bg-gradient-to-b from-card/80 to-background/40 backdrop-blur-md py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Link href="/exercises" className="hover:text-foreground transition-colors flex items-center gap-1 font-semibold">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Exercise Library</span>
              </Link>
              <span>/</span>
              <span className="text-foreground font-bold capitalize">{exercise.categoryNameEn || exercise.trainingType}</span>
              <span>/</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[200px]">{exercise.nameEn}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                    {exercise.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {formatEquipment(exercise.equipment)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-bold capitalize">
                    {exercise.movementPattern} Pattern
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                  {exercise.nameEn}
                </h1>
                <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-urdu mt-1" dir="rtl">
                  {exercise.nameUr}
                </p>
              </div>

              {/* Caloric Burn Metric Pill */}
              {exercise.estimatedCaloriesPerMinute && (
                <div className="flex items-center gap-3 bg-muted/40 p-3 sm:p-4 rounded-2xl border border-border/80 self-start md:self-auto">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Estimated Caloric Burn
                    </span>
                    <span className="text-base sm:text-lg font-black text-foreground">
                      ~{exercise.estimatedCaloriesPerMinute} kcal/min
                    </span>
                    <span className="text-[9px] text-muted-foreground block">
                      Based on MET {exercise.estimatedMetValue || 5.0} (70kg standard)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Layout */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT / MAIN COLUMN (8 cols): Visual Demonstration, Steps, Mistakes, Breathing */}
            <div className="lg:col-span-7 space-y-6">
              {/* Visual Demonstration Banner */}
              <Card className="rounded-3xl border border-border/80 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 sm:p-8 text-white overflow-hidden shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 text-center sm:text-start">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 block">
                      Biomechanical Movement Demonstration
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {exercise.nameEn}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                      {exercise.descriptionEn}
                    </p>
                    <div className="pt-2 text-[10px] text-slate-400">
                      Attribution: {exercise.mediaAttribution || "FitLife AI Anatomical Motion Guide"}
                    </div>
                  </div>

                  {/* Anatomical Motion Graphic */}
                  <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <Dumbbell className="h-16 w-16 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </Card>

              {/* 1. STARTING POSITION */}
              <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Compass className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    1. Starting Position & Setup
                  </h3>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/60">
                    {exercise.startingPositionEn}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-urdu bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20" dir="rtl">
                    {exercise.startingPositionUr}
                  </p>
                </div>
              </Card>

              {/* 2. STEP-BY-STEP EXECUTION GUIDE */}
              <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    2. Step-by-Step Execution
                  </h3>
                </div>

                <div className="space-y-3">
                  {exercise.executionStepsEn.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-muted/30 border border-border/60 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="h-6 w-6 rounded-lg bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <p className="text-xs text-foreground font-semibold leading-relaxed">
                          {step}
                        </p>
                        {exercise.executionStepsUr[idx] && (
                          <p className="text-[11px] font-semibold text-muted-foreground font-urdu" dir="rtl">
                            {exercise.executionStepsUr[idx]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 3. BREATHING TECHNIQUE */}
              <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
                    <Wind className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    3. Correct Breathing Technique
                  </h3>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-foreground/90 leading-relaxed bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/20">
                    {exercise.breathingPatternEn}
                  </p>
                  <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 font-urdu bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/20" dir="rtl">
                    {exercise.breathingPatternUr}
                  </p>
                </div>
              </Card>

              {/* 4. COMMON MISTAKES TO AVOID */}
              <Card className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    4. Common Mistakes to Avoid
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {exercise.commonMistakesEn.map((mistake, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                      <span className="text-rose-500 font-bold">&times;</span>
                      <div className="space-y-1">
                        <span>{mistake}</span>
                        {exercise.commonMistakesUr[idx] && (
                          <div className="text-[11px] text-muted-foreground font-urdu" dir="rtl">
                            {exercise.commonMistakesUr[idx]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 5. SAFETY PRECAUTIONS */}
              <Card className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">
                    5. Clinical Safety Precautions
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {exercise.safetyPrecautionsEn.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span>{tip}</span>
                        {exercise.safetyPrecautionsUr[idx] && (
                          <div className="text-[11px] text-muted-foreground font-urdu" dir="rtl">
                            {exercise.safetyPrecautionsUr[idx]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN (5 cols): Interactive Muscle Anatomy Map, Variations, Alternatives */}
            <div className="lg:col-span-5 space-y-6">
              {/* Muscle Anatomy Visualization Card */}
              <Card className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold text-foreground">
                      Target Muscle Anatomy
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold capitalize">
                    {exercise.primaryMuscle}
                  </Badge>
                </div>

                <div className="p-3 bg-muted/20 rounded-3xl border border-border/60 flex justify-center">
                  <MuscleMap
                    primaryMuscle={exercise.primaryMuscle}
                    secondaryMuscles={exercise.secondaryMuscles}
                    interactive={false}
                  />
                </div>

                {/* Muscle Labels */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Primary Target:
                    </span>
                    <span className="font-extrabold text-foreground capitalize">
                      {exercise.primaryMuscleNameEn || exercise.primaryMuscle}
                    </span>
                  </div>

                  {exercise.secondaryMuscles.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60">
                      <span className="font-semibold text-muted-foreground">
                        Secondary Synergists:
                      </span>
                      <span className="font-bold text-foreground capitalize">
                        {exercise.secondaryMuscles.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progressions & Variations */}
                <div className="mt-6 pt-5 border-t border-border/60 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Progressions & Regressions
                  </h4>

                  {exercise.easierVariation && (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Easier Regression
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {exercise.easierVariation}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {exercise.harderVariation && (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-rose-500" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Harder Progression
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {exercise.harderVariation}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* RELATED & ALTERNATIVE EXERCISES SECTION */}
          <div className="mt-12 pt-8 border-t border-border/60 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-foreground">
                  Related Exercises for {exercise.primaryMuscleNameEn || exercise.primaryMuscle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Alternative movements targeting the same primary muscle group.
                </p>
              </div>

              <Link href={`/exercises?muscle=${exercise.primaryMuscle}`}>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1">
                  <span>View All</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedList.slice(0, 3).map((rel) => (
                <ExerciseCard key={rel.id} exercise={rel} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

