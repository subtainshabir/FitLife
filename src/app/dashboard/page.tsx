"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useI18n } from "@/lib/i18n/context";
import {
  User,
  ArrowRight,
  Sparkles,
  Utensils,
  Dumbbell,
  LineChart,
  Lock,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Scale,
  Ruler,
  Target,
  Flame,
  Zap,
  Activity,
  HeartPulse,
  Apple,
  MapPin,
  ChevronRight,
  Calendar,
  Calculator,
  Plus,
  Clock,
} from "lucide-react";
import { UserProfile, BodyAssessment, FitnessGoal } from "@/db/schema";
import { kgToLbs } from "@/lib/services/fitness-calculator";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t, isRtl } = useI18n();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<BodyAssessment | null>(null);
  const [activeGoal, setActiveGoal] = useState<FitnessGoal | null>(null);
  const [goalProgress, setGoalProgress] = useState<any | null>(null);
  const [justOnboarded, setJustOnboarded] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("onboarded") === "true") {
      setJustOnboarded(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    async function loadDashboardData() {
      try {
        const [userRes, assessRes, goalsRes] = await Promise.all([
          fetch("/api/v1/users/me"),
          fetch("/api/v1/assessments/latest"),
          fetch("/api/v1/goals"),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setProfile(userData.profile);
        }

        if (assessRes.ok) {
          const assessData = await assessRes.json();
          setLatestAssessment(assessData.assessment || null);
        }

        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          setActiveGoal(goalsData.activeGoal || null);
          setGoalProgress(goalsData.activeGoalProgress || null);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      loadDashboardData();
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = session?.user?.name || "Athlete";

  // Real display attributes derived strictly from saved database records
  const currentWeightValue = profile?.currentWeight ?? latestAssessment?.weight ?? null;
  const targetWeightValue = activeGoal?.targetWeight ?? null;
  const bmiValue = latestAssessment?.bmi ?? null;
  const dailyCaloriesValue = latestAssessment?.targetCalories ?? null;
  const activeGoalType = activeGoal?.goalType ?? profile?.fitnessGoal ?? null;

  // Macro percentages from notes or defaults if assessment exists
  const assessNotes = (latestAssessment?.calculationNotes as Record<string, any>) || {};
  const macroPcts = assessNotes.macroPercentages || {
    protein: 25,
    carbs: 50,
    fat: 25,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Onboarding Success Banner */}
      {justOnboarded && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Calibration Complete!</h4>
              <p className="text-xs text-muted-foreground">
                Your physical metrics and dietary profile are safely locked into the database.
              </p>
            </div>
          </div>
          <button
            onClick={() => setJustOnboarded(false)}
            className="text-xs font-bold hover:underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Fitness-Themed Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-slate-950 text-white shadow-2xl">
        <img
          src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1400&auto=format&fit=crop"
          alt="Fitness Training Hub"
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-emerald-950/40" />

        <div className="relative z-10 p-4 sm:p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div className="max-w-xl space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-300 backdrop-blur-md">
                <Flame className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>Phase 2 Biometrics & Goals</span>
              </span>
              <span className="text-[11px] sm:text-xs text-slate-300">
                PostgreSQL 16 &bull; Verified
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow break-words">
              {t.dashboard.greeting},{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.dashboard.subtitle}
            </p>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2">
              <Link href="/assessment" className="w-full xs:w-auto">
                <Button size="sm" variant="gradient" className="w-full xs:w-auto gap-2 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25">
                  <Calculator className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.dashboard.takeAssessmentNow}</span>
                </Button>
              </Link>
              <Link href="/goals" className="w-full xs:w-auto">
                <Button size="sm" variant="outline" className="w-full xs:w-auto gap-2 text-xs font-semibold rounded-xl text-white border-white/20 hover:bg-white/10">
                  <Target className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{t.dashboard.setGoalNow}</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Biometric Status Summary Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shrink-0 w-full md:w-auto max-w-full sm:max-w-xs">
            <ProgressRing
              value={latestAssessment && activeGoal ? 100 : latestAssessment || profile ? 65 : 25}
              size={56}
              strokeWidth={5}
              circleClassName="text-emerald-400"
            >
              <span className="text-[11px] sm:text-xs text-white font-extrabold">
                {latestAssessment && activeGoal ? "100%" : latestAssessment || profile ? "65%" : "25%"}
              </span>
            </ProgressRing>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {latestAssessment && activeGoal
                  ? "Calibrated & Active Goal"
                  : latestAssessment
                  ? "Assessment Recorded"
                  : profile
                  ? "Profile Ready"
                  : "Calibration Needed"}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-300 block mt-0.5 line-clamp-2">
                {latestAssessment && activeGoal
                  ? "Track your weekly progress"
                  : latestAssessment
                  ? "Set your active goal next"
                  : "Perform initial body assessment"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 CORE METRIC CARDS (Current Weight, Target Weight, BMI, Daily Calorie Target) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <span>Phase 2 Biometric & Goal Indicators</span>
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/assessment" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Assessment</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-muted-foreground">&bull;</span>
            <Link href="/goals" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Goals</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. CURRENT WEIGHT CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                {t.dashboard.weight}
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>

            {currentWeightValue !== null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-foreground truncate">
                    {currentWeightValue}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">kg</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block truncate">
                  {kgToLbs(currentWeightValue)} lbs &bull; Live Metric
                </span>
              </>
            ) : (
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground block truncate">
                  Not Recorded
                </span>
                <Link href="/assessment">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-2 rounded-lg">
                    Record
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* 2. TARGET WEIGHT CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                {t.dashboard.targetWeight}
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>

            {targetWeightValue !== null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                    {targetWeightValue}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">kg</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block truncate">
                  {currentWeightValue ? `${Math.round(Math.abs(targetWeightValue - currentWeightValue) * 10) / 10} kg diff` : "Active Target"}
                </span>
              </>
            ) : (
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground block truncate">
                  No Goal Target
                </span>
                <Link href="/goals">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-2 rounded-lg">
                    Set Target
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* 3. BMI CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                {t.dashboard.currentBmi}
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <HeartPulse className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>

            {bmiValue !== null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-foreground truncate">
                    {bmiValue}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">kg/m²</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] capitalize px-1.5 py-0 truncate">
                    {latestAssessment?.bmiCategory?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground block truncate">
                  Uncalculated
                </span>
                <Link href="/assessment">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-2 rounded-lg">
                    Calculate
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* 4. DAILY CALORIE TARGET CARD */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                {t.dashboard.dailyCalories}
              </span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>

            {dailyCaloriesValue !== null ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl md:text-3xl font-black text-foreground truncate">
                    {dailyCaloriesValue.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">kcal</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block truncate">
                  {latestAssessment?.targetProteinGrams}g P &bull; {latestAssessment?.targetCarbsGrams}g C &bull; {latestAssessment?.targetFatGrams}g F
                </span>
              </>
            ) : (
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground block truncate">
                  Uncalculated
                </span>
                <Link href="/assessment">
                  <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-2 rounded-lg">
                    Get Macros
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE FITNESS GOAL & PROGRESS HERO BANNER */}
      {activeGoal ? (
        <Card className="rounded-2xl sm:rounded-3xl border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    {t.dashboard.activeGoal}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                    {t.goals[activeGoal.goalType] || activeGoal.goalType}
                  </h3>
                </div>
              </div>

              {/* Goal Progress bar */}
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">{t.dashboard.goalProgress}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {goalProgress?.percentage ?? 0}% completed
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${goalProgress?.percentage ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Timeline info */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Started: {new Date(activeGoal.startDate).toLocaleDateString()}</span>
                </span>
                {activeGoal.targetDate && (
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Target Date: {new Date(activeGoal.targetDate).toLocaleDateString()}</span>
                  </span>
                )}
                {activeGoal.targetRate && (
                  <span className="text-[11px] font-semibold">
                    Pace: {activeGoal.targetRate} kg/week
                  </span>
                )}
              </div>
            </div>

            {/* Circular Ring and Link */}
            <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:items-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
              <ProgressRing
                value={goalProgress?.percentage ?? 0}
                size={64}
                strokeWidth={6}
                circleClassName="text-emerald-500"
              >
                <span className="text-xs font-black text-foreground">
                  {goalProgress?.percentage ?? 0}%
                </span>
              </ProgressRing>

              <Link href="/goals" className="w-auto">
                <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1">
                  <span>Manage Goal</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        /* Empty State if no active goal */
        <Card className="rounded-2xl sm:rounded-3xl border-dashed border-2 border-border/80 p-4 sm:p-6 text-center space-y-3">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t.dashboard.noGoalData}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Establish a target weight with safe weekly pacing (0.25 - 0.75 kg/wk) to start tracking.
            </p>
          </div>
          <Link href="/goals">
            <Button size="sm" variant="gradient" className="rounded-xl text-xs font-bold gap-1.5">
              <Plus className="h-4 w-4" />
              <span>{t.dashboard.setGoalNow}</span>
            </Button>
          </Link>
        </Card>
      )}

      {/* NUTRITION MACRO BLUEPRINT (Rendered from real assessment or empty state) */}
      <Card className="border-border/80 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-border/60 pb-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <Apple className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                Daily Estimated Nutrition Targets
              </h3>
              <p className="text-xs text-muted-foreground">
                {latestAssessment
                  ? `Deterministic calculations calibrated for ${latestAssessment.primaryGoal.replace(/_/g, " ")}`
                  : "Calculate your body assessment to view evidence-based protein, carb, and fat targets"}
              </p>
            </div>
          </div>

          {latestAssessment && (
            <Link href="/assessment" className="self-end sm:self-auto">
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1">
                <span>Recalculate</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {latestAssessment ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-center">
            {/* Protein Target */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <ProgressRing
                value={macroPcts.protein}
                size={76}
                strokeWidth={7}
                circleClassName="text-emerald-500"
              >
                <span className="text-xs font-black text-foreground">{macroPcts.protein}%</span>
              </ProgressRing>
              <span className="text-xs font-bold text-foreground mt-3">
                {latestAssessment.targetProteinGrams}g Protein
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {latestAssessment.targetProteinGrams * 4} kcal &bull; Lean muscle synthesis
              </span>
            </div>

            {/* Carbohydrates Target */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <ProgressRing
                value={macroPcts.carbs}
                size={76}
                strokeWidth={7}
                circleClassName="text-amber-500"
              >
                <span className="text-xs font-black text-foreground">{macroPcts.carbs}%</span>
              </ProgressRing>
              <span className="text-xs font-bold text-foreground mt-3">
                {latestAssessment.targetCarbsGrams}g Carbohydrates
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {latestAssessment.targetCarbsGrams * 4} kcal &bull; Glycogen & daily energy
              </span>
            </div>

            {/* Healthy Fats Target */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
              <ProgressRing
                value={macroPcts.fat}
                size={76}
                strokeWidth={7}
                circleClassName="text-cyan-500"
              >
                <span className="text-xs font-black text-foreground">{macroPcts.fat}%</span>
              </ProgressRing>
              <span className="text-xs font-bold text-foreground mt-3">
                {latestAssessment.targetFatGrams}g Fats
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {latestAssessment.targetFatGrams * 9} kcal &bull; Hormonal health support
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No nutritional calculations recorded yet. Complete your body assessment to generate your personalized daily calorie and macro target breakdown.
            </p>
            <Link href="/assessment">
              <Button size="sm" variant="gradient" className="rounded-xl text-xs font-bold">
                Perform Assessment
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Prominent Visual AI Coach Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute top-0 end-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-black text-white">
                  FitLife AI Fitness Coach
                </h3>
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 3 Flagship
                </Badge>
              </div>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                24/7 conversational coaching reasoning on your physical metrics, BMI, BMR, and fitness objectives.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            onClick={() => setShowAiModal(true)}
            className="w-full md:w-auto text-xs font-bold px-6 py-2.5 sm:py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 shadow-lg shadow-black/30 shrink-0"
          >
            <span>Preview AI Coach</span>
            <ArrowRight className={`h-4 w-4 ms-2 ${isRtl ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* PHASE 3: PAKISTANI FOOD DATABASE & LOCAL MARKET PRICING */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-foreground">
                Pakistani Food Nutrition & Local Market Pricing
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                Phase 3 Live
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Authentic Pakistani nutritional data (FCT/USDA), multi-city government rate lists, and cost-efficiency indexes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/foods">
              <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl gap-1.5">
                <span>Explore 40+ Foods</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Interactive Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Food Explorer Card */}
          <Link href="/foods" className="group">
            <Card className="rounded-3xl border border-border/80 hover:border-emerald-500/50 bg-card p-5 h-full transition-all hover:shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Database Live
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground group-hover:text-emerald-500 transition-colors">
                    Pakistani Food Explorer
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Search 40+ local items in English and Urdu. View exact calories, protein, carbs, and fat per 100g and common serving units.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Browse Foods</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>

          {/* 2. Market Prices Card */}
          <Link href="/prices" className="group">
            <Card className="rounded-3xl border border-border/80 hover:border-emerald-500/50 bg-card p-5 h-full transition-all hover:shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-teal-600 dark:text-teal-400 border-teal-500/30">
                    5+ Cities
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground group-hover:text-teal-500 transition-colors">
                    Regional Market Prices
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Compare verified prices across Kotli (AJK), Rawalpindi, Islamabad, Lahore, and Karachi from DC lists & markets.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                <span>Check City Rates</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>

          {/* 3. Nutrition & Cost Calculator Card */}
          <Link href="/calculator" className="group">
            <Card className="rounded-3xl border border-border/80 hover:border-emerald-500/50 bg-card p-5 h-full transition-all hover:shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                    Deterministic
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground group-hover:text-cyan-500 transition-colors">
                    Portion & Meal Calculator
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Calculate exact macros and estimated meal cost for any serving (grams, cups, spoons, pieces) in PKR.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <span>Calculate Serving</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Protein Value Leaderboard Spotlight */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-foreground">
                  Pakistan Protein Cost-Efficiency Benchmark
                </h4>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  Top Value
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                <strong>Daal Chana (Raw)</strong> is currently the most affordable protein source in Punjab (~PKR 25 per 20g protein), followed by <strong>Chicken Breast</strong> (~PKR 60 per 20g protein) and <strong>Farm Eggs</strong> (~PKR 95 per 20g protein).
              </p>
            </div>
          </div>

          <Link href="/prices?tab=compare" className="shrink-0 self-end sm:self-center">
            <Button variant="default" size="sm" className="h-9 text-xs font-bold rounded-xl gap-1.5 shadow-md shadow-emerald-500/20">
              <span>View Leaderboard</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* PHASE 4: AI NUTRITION PLANNER & BUDGET-BASED DIET PLANS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-foreground">
                AI Nutrition Planner & Budget Diet Plans
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                Phase 4 Live
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Automated Pakistani meal schedules tailored to your calorie targets, local city rates, and PKR food budget.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/nutrition">
              <Button variant="gradient" size="sm" className="h-8 text-xs font-bold rounded-xl gap-1.5 shadow-md shadow-emerald-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Open Nutrition Planner</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Nutrition Feature Card Banner */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-card to-card p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground">
                  Personalized Pakistani Diet Schedules with Local PKR Costing
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Generate 3–6 meal daily schedules, track daily/weekly grocery costs, substitute ingredients for cheaper high-protein staples (like Daal Chana and Farm Eggs), and export interactive shopping checklists.
              </p>
            </div>
          </div>

          <Link href="/nutrition" className="shrink-0 self-end md:self-center">
            <Button variant="default" size="sm" className="h-10 text-xs font-bold rounded-xl px-5 gap-2 shadow-lg shadow-emerald-500/20">
              <span>Generate My Meal Plan</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Picture-Rich Workout & Wellness Feature Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              {t.dashboard.upcomingFeatures}
            </h2>
            <p className="text-xs text-muted-foreground">
              Future roadmap previews
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Workout Card */}
          <div id="workouts" className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="relative h-44 overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
                alt="Intelligent Workout Planner"
                className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <div className="absolute top-3 end-3">
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 3+
                </Badge>
              </div>
              <div className="absolute bottom-3 start-4">
                <div className="h-9 w-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md">
                  <Dumbbell className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="p-5 pt-2">
              <h3 className="text-sm font-extrabold text-foreground">
                Intelligent Workout Planner
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t.dashboard.workoutsDesc}
              </p>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span>Unlocks in Phase 3</span>
                </span>
              </div>
            </div>
          </div>

          {/* Nutrition Card */}
          <Link href="/foods" id="nutrition" className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300 block">
            <div className="relative h-44 overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop"
                alt="Pakistani & Global Meal Plans"
                className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <div className="absolute top-3 end-3">
                <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                  Phase 3 Live
                </Badge>
              </div>
              <div className="absolute bottom-3 start-4">
                <div className="h-9 w-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                  <Utensils className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="p-5 pt-2">
              <h3 className="text-sm font-extrabold text-foreground group-hover:text-emerald-500 transition-colors">
                Pakistani Food Database
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Explore local foods, verified regional market rates, and portion macro calculations. Automated meal planning unlocks in Phase 4.
              </p>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Browse Foods Database</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>

          {/* Progress Analytics Card */}
          <div id="progress" className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="relative h-44 overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop"
                alt="Progress Tracking"
                className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <div className="absolute top-3 end-3">
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 3+
                </Badge>
              </div>
              <div className="absolute bottom-3 start-4">
                <div className="h-9 w-9 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-md">
                  <LineChart className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="p-5 pt-2">
              <h3 className="text-sm font-extrabold text-foreground">
                Progressive Overload Analytics
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t.dashboard.progressDesc}
              </p>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span>Charts unlock in Phase 3</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Preview Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-card p-4 sm:p-6 shadow-2xl relative text-start">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                  FitLife {t.common.aiCoach}
                </h3>
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 3 Preview
                </Badge>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden mb-4 border border-border/80 h-28 sm:h-32 bg-slate-900 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop"
                alt="AI Fitness Companion"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                loading="lazy"
              />
              <div className="relative z-10 text-center px-4">
                <span className="text-xs font-bold text-white drop-shadow">
                  Phase 2 Biometrics Ready
                </span>
                <p className="text-[11px] text-emerald-300 mt-1">
                  Ready to seed conversational coaching in Phase 3
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {t.dashboard.aiCoachDesc}
            </p>

            <Button
              variant="default"
              className="w-full text-xs font-bold rounded-xl"
              onClick={() => setShowAiModal(false)}
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <DashboardNav />

      <main className="flex-1 container px-3 sm:px-6 md:px-8 py-6 sm:py-8 pb-24 md:pb-12 max-w-6xl mx-auto">
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <DashboardContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
