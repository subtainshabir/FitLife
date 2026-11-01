"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useI18n } from "@/lib/i18n/context";
import {
  Target,
  Scale,
  TrendingDown,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Loader2,
  ChevronRight,
  Flame,
  Dumbbell,
  Heart,
  Zap,
  Info,
} from "lucide-react";
import { FitnessGoal, BodyMeasurementHistory } from "@/db/schema";
import { FITNESS_GOALS } from "@/lib/validations/profile";
import {
  calculateGoalTimeline,
  kgToLbs,
  lbsToKg,
} from "@/lib/services/fitness-calculator";

// Goal Cards Metadata with Fitness-Inspired Visuals
const GOAL_ICONS: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  weight_loss: { icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  fat_reduction: { icon: Flame, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  muscle_building: { icon: Dumbbell, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  weight_gain: { icon: TrendingUp, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/30" },
  weight_maintenance: { icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  body_recomposition: { icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
  strength_improvement: { icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  endurance: { icon: Heart, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  general_fitness: { icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

export default function GoalsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, isRtl } = useI18n();

  // Unit system
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");

  // Data State
  const [loading, setLoading] = useState(true);
  const [activeGoal, setActiveGoal] = useState<FitnessGoal | null>(null);
  const [activeGoalProgress, setActiveGoalProgress] = useState<any>(null);
  const [goalsList, setGoalsList] = useState<FitnessGoal[]>([]);
  const [weightHistory, setWeightHistory] = useState<BodyMeasurementHistory[]>([]);
  const [userProfileWeight, setUserProfileWeight] = useState<number>(70);

  // Goal Form State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalType, setGoalType] = useState<string>("weight_loss");
  const [currentWeight, setCurrentWeight] = useState<number | "">(70);
  const [targetWeight, setTargetWeight] = useState<number | "">(65);
  const [targetRate, setTargetRate] = useState<number>(0.5); // kg/week
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [goalNotes, setGoalNotes] = useState<string>("");
  const [submittingGoal, setSubmittingGoal] = useState(false);

  // Weight Log Modal State
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [logWeightValue, setLogWeightValue] = useState<number | "">(70);
  const [logWeightNotes, setLogWeightNotes] = useState<string>("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load goals and weight progress from API
  async function fetchData() {
    try {
      const [goalsRes, weightRes, userRes] = await Promise.all([
        fetch("/api/v1/goals"),
        fetch("/api/v1/progress/weight"),
        fetch("/api/v1/users/me"),
      ]);

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setActiveGoal(data.activeGoal);
        setActiveGoalProgress(data.activeGoalProgress);
        setGoalsList(data.goals || []);
      }

      if (weightRes.ok) {
        const weightData = await weightRes.json();
        setWeightHistory(weightData.history || []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.profile?.currentWeight) {
          setUserProfileWeight(userData.profile.currentWeight);
          setCurrentWeight(userData.profile.currentWeight);
          setLogWeightValue(userData.profile.currentWeight);
        }
      }
    } catch (err) {
      console.error("Goals data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/goals");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  // Unit toggle
  const handleUnitToggle = (newUnit: "metric" | "imperial") => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    if (newUnit === "imperial") {
      if (typeof currentWeight === "number") setCurrentWeight(kgToLbs(currentWeight));
      if (typeof targetWeight === "number") setTargetWeight(kgToLbs(targetWeight));
      if (typeof logWeightValue === "number") setLogWeightValue(kgToLbs(logWeightValue));
    } else {
      if (typeof currentWeight === "number") setCurrentWeight(lbsToKg(currentWeight));
      if (typeof targetWeight === "number") setTargetWeight(lbsToKg(targetWeight));
      if (typeof logWeightValue === "number") setLogWeightValue(lbsToKg(logWeightValue));
    }
  };

  // Submit Goal (Create or Edit)
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGoal(true);
    setNotification(null);

    try {
      let finalCurrent = typeof currentWeight === "number" ? currentWeight : 70;
      let finalTarget = typeof targetWeight === "number" ? targetWeight : 65;
      let finalRate = targetRate;

      if (unit === "imperial") {
        finalCurrent = lbsToKg(finalCurrent);
        finalTarget = lbsToKg(finalTarget);
        finalRate = lbsToKg(finalRate);
      }

      if (editingGoalId) {
        // PATCH
        const res = await fetch(`/api/v1/goals/${editingGoalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentWeight: finalCurrent,
            targetWeight: finalTarget,
            targetRate: finalRate,
            notes: goalNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotification({ type: "error", text: data.error || "Failed to update goal." });
          setSubmittingGoal(false);
          return;
        }
        setNotification({ type: "success", text: t.goalsManagement.goalUpdatedSuccess });
      } else {
        // POST new goal
        const res = await fetch("/api/v1/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goalType,
            currentWeight: finalCurrent,
            targetWeight: finalTarget,
            targetRate: finalRate,
            startDate,
            notes: goalNotes,
            unit: "metric",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setNotification({ type: "error", text: data.error || "Failed to create goal." });
          setSubmittingGoal(false);
          return;
        }
        setNotification({ type: "success", text: t.goalsManagement.goalCreatedSuccess });
      }

      setShowGoalModal(false);
      setEditingGoalId(null);
      await fetchData();
    } catch (err) {
      console.error("Submit goal error:", err);
      setNotification({ type: "error", text: "Network error occurred." });
    } finally {
      setSubmittingGoal(false);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm(t.goalsManagement.deleteGoalConfirm)) return;
    try {
      const res = await fetch(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      if (res.ok) {
        setNotification({ type: "success", text: t.goalsManagement.goalDeletedSuccess });
        await fetchData();
      }
    } catch (err) {
      console.error("Delete goal error:", err);
    }
  };

  // Mark Completed or Paused
  const handleUpdateStatus = async (goalId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setNotification({ type: "success", text: `Goal marked as ${newStatus}` });
        await fetchData();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Log Current Weight
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingWeight(true);
    try {
      let finalWeight = typeof logWeightValue === "number" ? logWeightValue : 70;
      if (unit === "imperial") {
        finalWeight = lbsToKg(finalWeight);
      }

      const res = await fetch("/api/v1/progress/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: finalWeight,
          notes: logWeightNotes,
          unit: "kg",
          updateProfileCurrentWeight: true,
        }),
      });

      if (res.ok) {
        setNotification({ type: "success", text: t.goalsManagement.loggedSuccess });
        setShowWeightModal(false);
        setLogWeightNotes("");
        await fetchData();
      }
    } catch (err) {
      console.error("Log weight error:", err);
    } finally {
      setLoggingWeight(false);
    }
  };

  // Open modal for editing
  const openEditModal = (goal: FitnessGoal) => {
    setEditingGoalId(goal.id);
    setGoalType(goal.goalType);
    setCurrentWeight(unit === "imperial" && goal.currentWeight ? kgToLbs(goal.currentWeight) : goal.currentWeight || 70);
    setTargetWeight(unit === "imperial" && goal.targetWeight ? kgToLbs(goal.targetWeight) : goal.targetWeight || 65);
    setTargetRate(goal.targetRate || 0.5);
    setGoalNotes(goal.notes || "");
    setShowGoalModal(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Display conversions for active goal
  const activeIconConfig = activeGoal ? GOAL_ICONS[activeGoal.goalType] || GOAL_ICONS.general_fitness : GOAL_ICONS.general_fitness;
  const ActiveIcon = activeIconConfig.icon;

  const currentDisplayWeight = activeGoal?.currentWeight
    ? unit === "imperial"
      ? `${kgToLbs(activeGoalProgress?.currentLiveWeight ?? activeGoal.currentWeight)} lbs`
      : `${activeGoalProgress?.currentLiveWeight ?? activeGoal.currentWeight} kg`
    : "--";

  const targetDisplayWeight = activeGoal?.targetWeight
    ? unit === "imperial"
      ? `${kgToLbs(activeGoal.targetWeight)} lbs`
      : `${activeGoal.targetWeight} kg`
    : "--";

  const deltaDisplay = activeGoal?.targetWeight && activeGoal?.currentWeight
    ? unit === "imperial"
      ? `${kgToLbs(Math.abs(activeGoal.targetWeight - (activeGoalProgress?.currentLiveWeight ?? activeGoal.currentWeight)))} lbs`
      : `${Math.round(Math.abs(activeGoal.targetWeight - (activeGoalProgress?.currentLiveWeight ?? activeGoal.currentWeight)) * 10) / 10} kg`
    : "--";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardNav />

      <main className="flex-1 container mx-auto px-4 sm:px-8 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Target className="h-3.5 w-3.5" />
                <span>Goal Engine & Progression</span>
              </span>
              <span className="text-xs text-muted-foreground">Safe & Realistic Pacing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
              {t.goalsManagement.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t.goalsManagement.subtitle}
            </p>
          </div>

          {/* Quick Actions & Unit Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/70 p-1.5 rounded-2xl border border-border/80">
              <button
                type="button"
                onClick={() => handleUnitToggle("metric")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  unit === "metric"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.common.metric}
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle("imperial")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  unit === "imperial"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.common.imperial}
              </button>
            </div>

            <Button
              onClick={() => {
                setEditingGoalId(null);
                setShowGoalModal(true);
              }}
              variant="gradient"
              className="rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>{t.goalsManagement.createNewGoal}</span>
            </Button>

            <Button
              onClick={() => setShowWeightModal(true)}
              variant="outline"
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Scale className="h-4 w-4 text-emerald-500" />
              <span>{t.goalsManagement.logNewWeight}</span>
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-xs font-bold animate-in fade-in ${
              notification.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ACTIVE GOAL HERO CARD */}
        {activeGoal ? (
          <Card className="rounded-3xl border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xl p-6 sm:p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 end-0 p-6 opacity-10 pointer-events-none">
              <ActiveIcon className="h-44 w-44" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl ${activeIconConfig.bg} ${activeIconConfig.color} flex items-center justify-center shadow-md`}>
                    <ActiveIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      {t.goalsManagement.activeGoalCard}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground">
                      {t.goals[activeGoal.goalType] || activeGoal.goalType}
                    </h2>
                  </div>
                </div>

                {activeGoal.notes && (
                  <p className="text-xs text-muted-foreground italic">
                    "{activeGoal.notes}"
                  </p>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                  <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-sm p-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      {t.goalsManagement.currentWeight}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-foreground block mt-0.5">
                      {currentDisplayWeight}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-sm p-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      {t.goalsManagement.targetWeight}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {targetDisplayWeight}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-background/80 backdrop-blur-sm p-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                      {t.goalsManagement.difference}
                    </span>
                    <span className="text-lg sm:text-xl font-black text-foreground block mt-0.5">
                      {deltaDisplay}
                    </span>
                  </div>
                </div>

                {/* Target Timeline and Safe Pace Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {t.goalsManagement.startDate}:{" "}
                      {new Date(activeGoal.startDate).toLocaleDateString()}
                    </span>
                  </span>

                  {activeGoal.targetDate && (
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        {t.goalsManagement.targetDate}:{" "}
                        {new Date(activeGoal.targetDate).toLocaleDateString()}
                      </span>
                    </span>
                  )}

                  {activeGoal.targetRate && (
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Pace: {unit === "imperial" ? `${kgToLbs(activeGoal.targetRate)} lbs/wk` : `${activeGoal.targetRate} kg/wk`}
                    </span>
                  )}
                </div>
              </div>

              {/* Circular Progress & Quick Actions */}
              <div className="flex flex-col items-center sm:items-end gap-4 shrink-0">
                <div className="flex items-center gap-4 bg-background/80 backdrop-blur-sm p-4 rounded-3xl border border-border/80 shadow-sm">
                  <ProgressRing
                    value={activeGoalProgress?.percentage ?? 0}
                    size={84}
                    strokeWidth={8}
                    circleClassName="text-emerald-500"
                  >
                    <span className="text-sm font-black text-foreground">
                      {activeGoalProgress?.percentage ?? 0}%
                    </span>
                  </ProgressRing>

                  <div className="text-start">
                    <span className="text-xs font-extrabold text-foreground block">
                      {t.goalsManagement.progressPercentage}
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {activeGoalProgress?.weightRemainingKg
                        ? `${activeGoalProgress.weightRemainingKg} kg remaining`
                        : "On track"}
                    </span>
                    <Badge variant="success" className="mt-2 text-[10px]">
                      {t.goalsManagement.inProgress}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(activeGoal)}
                    className="rounded-xl text-xs font-semibold gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{t.common.edit}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(activeGoal.id, "completed")}
                    className="rounded-xl text-xs font-semibold gap-1 text-emerald-600 hover:text-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t.goalsManagement.completed}</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* Empty State if no active goal */
          <Card className="rounded-3xl border-dashed border-2 border-border/80 p-8 sm:p-12 text-center space-y-4 mb-8">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
              <Target className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">{t.goalsManagement.noActiveGoal}</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Choose a targeted goal (weight loss, muscle building, recomp, etc.) with safe, healthy weekly pacing.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingGoalId(null);
                setShowGoalModal(true);
              }}
              variant="gradient"
              className="rounded-xl text-xs font-bold"
            >
              <Plus className="h-4 w-4 me-1.5" />
              <span>{t.goalsManagement.setFirstGoal}</span>
            </Button>
          </Card>
        )}

        {/* BOTTOM SECTION: Illustrated Goal Selection Grid & Weight History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Goal Exploration / Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span>Illustrated Fitness Objectives</span>
              </h3>
              <span className="text-xs text-muted-foreground">Select to Configure</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {FITNESS_GOALS.map((g) => {
                const conf = GOAL_ICONS[g] || GOAL_ICONS.general_fitness;
                const IconComponent = conf.icon;
                const isSelected = activeGoal?.goalType === g;

                return (
                  <div
                    key={g}
                    onClick={() => {
                      setGoalType(g);
                      setEditingGoalId(null);
                      setShowGoalModal(true);
                    }}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                        : "border-border/80 bg-card hover:border-emerald-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`h-9 w-9 rounded-xl ${conf.bg} ${conf.color} flex items-center justify-center`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <Badge variant="success" className="text-[9px]">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      {t.goals[g] || g}
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Safe calculations & macro scaling
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weight Progression & History Log (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <span>{t.goalsManagement.weightHistoryTitle}</span>
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowWeightModal(true)}
                className="h-8 rounded-xl text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5 me-1" />
                <span>Log</span>
              </Button>
            </div>

            <Card className="rounded-3xl border-border/80 p-5 shadow-sm">
              {weightHistory.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {weightHistory.slice(0, 7).map((entry) => {
                    const displayW =
                      unit === "imperial"
                        ? `${kgToLbs(entry.weight)} lbs`
                        : `${entry.weight} kg`;

                    return (
                      <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-black text-foreground block">
                            {displayW}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(entry.recordedAt).toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })}
                          </span>
                        </div>
                        <div className="text-end">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted/60">
                            {entry.source}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No weight history recorded yet. Use the "Log" button above to record your first entry.
                </div>
              )}
            </Card>

            {/* Past Goals Archive */}
            {goalsList.length > 1 && (
              <Card className="rounded-3xl border-border/80 p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Previous Goals
                </h4>
                <div className="space-y-2">
                  {goalsList
                    .filter((g) => g.id !== activeGoal?.id)
                    .slice(0, 3)
                    .map((oldGoal) => (
                      <div
                        key={oldGoal.id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-muted/30"
                      >
                        <div>
                          <span className="font-bold text-foreground block">
                            {t.goals[oldGoal.goalType] || oldGoal.goalType}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {oldGoal.targetWeight ? `${oldGoal.targetWeight} kg target` : "Objective"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] capitalize">
                            {oldGoal.status}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteGoal(oldGoal.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* CREATE / EDIT GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-2xl relative text-start space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                <span>{editingGoalId ? t.goalsManagement.updateGoalButton : t.goalsManagement.createNewGoal}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowGoalModal(false);
                  setEditingGoalId(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              {/* Goal Type */}
              <div className="space-y-1.5">
                <Label htmlFor="modalGoalType" className="text-xs font-bold">
                  {t.goalsManagement.goalType}
                </Label>
                <select
                  id="modalGoalType"
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  disabled={!!editingGoalId}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {FITNESS_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {t.goals[g] || g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Weight & Target Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="modalCurrentWeight" className="text-xs font-bold">
                    {t.goalsManagement.currentWeight} ({unit === "metric" ? "kg" : "lbs"})
                  </Label>
                  <Input
                    id="modalCurrentWeight"
                    type="number"
                    step="0.1"
                    min={20}
                    max={1100}
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modalTargetWeight" className="text-xs font-bold">
                    {t.goalsManagement.targetWeight} ({unit === "metric" ? "kg" : "lbs"})
                  </Label>
                  <Input
                    id="modalTargetWeight"
                    type="number"
                    step="0.1"
                    min={20}
                    max={1100}
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              {/* Weekly Rate Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="modalRate" className="text-xs font-bold">
                    {t.goalsManagement.desiredRate}
                  </Label>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {targetRate} kg / week ({kgToLbs(targetRate)} lbs/wk)
                  </span>
                </div>
                <input
                  id="modalRate"
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={targetRate}
                  onChange={(e) => setTargetRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold px-1">
                  <span>0.25 kg (Gentle)</span>
                  <span>0.5 kg (Recommended)</span>
                  <span>0.75 kg (Active)</span>
                  <span>1.0+ kg (Aggressive)</span>
                </div>
              </div>

              {/* Safe Rate Warning if rate > 1.0 */}
              {targetRate > 1.0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>{t.goalsManagement.unsafeRateWarning}</p>
                </div>
              )}

              {/* Safe Rate Notice */}
              {targetRate <= 1.0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>{t.goalsManagement.safeRateNotice}</p>
                </div>
              )}

              {/* Start Date */}
              {!editingGoalId && (
                <div className="space-y-1.5">
                  <Label htmlFor="modalStartDate" className="text-xs font-bold">
                    {t.goalsManagement.startDate}
                  </Label>
                  <Input
                    id="modalStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="modalNotes" className="text-xs font-bold">
                  {t.goalsManagement.notes}
                </Label>
                <Input
                  id="modalNotes"
                  type="text"
                  maxLength={500}
                  value={goalNotes}
                  onChange={(e) => setGoalNotes(e.target.value)}
                  placeholder={t.goalsManagement.notesPlaceholder}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowGoalModal(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingGoal}
                  variant="gradient"
                  className="rounded-xl text-xs font-bold gap-2"
                >
                  {submittingGoal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  <span>
                    {editingGoalId
                      ? t.goalsManagement.updateGoalButton
                      : t.goalsManagement.createGoalButton}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG WEIGHT MODAL */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card p-6 shadow-2xl relative text-start space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-500" />
                <span>{t.goalsManagement.logNewWeight}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogWeight} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="logWeightInput" className="text-xs font-bold">
                  Weight ({unit === "metric" ? "kg" : "lbs"})
                </Label>
                <Input
                  id="logWeightInput"
                  type="number"
                  step="0.1"
                  min={20}
                  max={1100}
                  value={logWeightValue}
                  onChange={(e) => setLogWeightValue(parseFloat(e.target.value) || 0)}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="logNotesInput" className="text-xs font-bold">
                  Notes (Optional)
                </Label>
                <Input
                  id="logNotesInput"
                  type="text"
                  maxLength={200}
                  placeholder="Morning weigh-in, post-fasting..."
                  value={logWeightNotes}
                  onChange={(e) => setLogWeightNotes(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowWeightModal(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={loggingWeight}
                  variant="gradient"
                  className="rounded-xl text-xs font-bold"
                >
                  {loggingWeight ? (
                    <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                  ) : null}
                  <span>Save Log</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

