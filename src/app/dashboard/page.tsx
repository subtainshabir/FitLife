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
} from "lucide-react";
import { UserProfile } from "@/db/schema";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t, isRtl } = useI18n();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

    async function loadData() {
      try {
        const res = await fetch("/api/v1/users/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      loadData();
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
        {/* Background Athletic Image */}
        <img
          src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1400&auto=format&fit=crop"
          alt="Fitness Training Hub"
          className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-emerald-950/40" />

        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-0.5 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
                <Flame className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>Phase 1 Active</span>
              </span>
              <span className="text-xs text-slate-300">
                Connected &bull; PostgreSQL 16
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow">
              Welcome back, <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">{userName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your biometric attributes, fitness objectives, and dietary preferences are calibrated. Explore your baseline physical overview below.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Link href="/profile">
                <Button size="sm" variant="gradient" className="gap-2 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Update Profile</span>
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button size="sm" variant="outline" className="gap-2 text-xs font-semibold rounded-xl text-white border-white/20 hover:bg-white/10">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Re-Calibrate</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Profile Health Indicator Widget */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-4 shrink-0 max-w-xs">
            <ProgressRing
              value={profile ? 100 : 25}
              size={64}
              strokeWidth={6}
              circleClassName="text-emerald-400"
            >
              <span className="text-xs text-white font-extrabold">{profile ? "100%" : "25%"}</span>
            </ProgressRing>
            <div>
              <span className="text-xs font-bold text-white block">
                {profile ? "Profile Calibrated" : "Calibration Needed"}
              </span>
              <span className="text-[11px] text-slate-300 block mt-0.5">
                {profile ? "Ready for Phase 2 AI" : "Complete onboarding now"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Incomplete Profile Alert if no profile */}
      {!profile && (
        <Card className="border-amber-500/40 bg-amber-500/10 rounded-2xl">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t.dashboard.profileIncompleteAlert}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add height, weight, and fitness goals to prepare your account.
                </p>
              </div>
            </div>
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button variant="default" size="sm" className="w-full sm:w-auto text-xs font-bold rounded-xl gap-2">
                <span>{t.dashboard.completeProfileNow}</span>
                <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Visual Metrics Cards */}
      {profile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span>Baseline Physical Metrics</span>
            </h2>
            <Link href="/profile" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Edit Details</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Weight Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Weight
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {profile.currentWeight ? profile.currentWeight : "--"}
                </span>
                <span className="text-xs font-bold text-muted-foreground">kg</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Recorded Physical Metric
              </span>
            </div>

            {/* Height Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Height
                </span>
                <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Ruler className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {profile.height ? profile.height : "--"}
                </span>
                <span className="text-xs font-bold text-muted-foreground">cm</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Standard Stature
              </span>
            </div>

            {/* Fitness Goal Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Objective
                </span>
                <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="text-sm font-extrabold text-foreground truncate">
                {profile.fitnessGoal ? (t.goals[profile.fitnessGoal] || profile.fitnessGoal) : "General Fitness"}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block capitalize">
                {profile.fitnessExperience || "Beginner"} level
              </span>
            </div>

            {/* Location & Currency Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Region
                </span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              <div className="text-sm font-extrabold text-foreground truncate">
                {profile.city && profile.country ? `${profile.city}, ${profile.country}` : "Pakistan"}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Currency: <strong className="text-foreground">{profile.preferredCurrency}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Macro Indicators (Visual Progress Rings Placeholder) */}
      <Card className="border-border/80 bg-card rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Nutrition Macro Target Ratios
              </h3>
              <p className="text-xs text-muted-foreground">
                Target macronutrient blueprint (Phase 2 dynamic tracker preview)
              </p>
            </div>
          </div>
          <Badge variant="comingSoon" className="text-[10px] self-start sm:self-auto">
            Phase 2 Integration
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {/* Protein Ratio */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-muted/20 border border-border/60">
            <ProgressRing
              value={35}
              size={76}
              strokeWidth={7}
              circleClassName="text-emerald-500"
            >
              <span className="text-xs font-black text-foreground">35%</span>
            </ProgressRing>
            <span className="text-xs font-bold text-foreground mt-3">Protein Target</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Lean tissue building ratio</span>
          </div>

          {/* Carbs Ratio */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-muted/20 border border-border/60">
            <ProgressRing
              value={45}
              size={76}
              strokeWidth={7}
              circleClassName="text-amber-500"
            >
              <span className="text-xs font-black text-foreground">45%</span>
            </ProgressRing>
            <span className="text-xs font-bold text-foreground mt-3">Complex Carbs</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Sustained athletic energy</span>
          </div>

          {/* Healthy Fats Ratio */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-muted/20 border border-border/60">
            <ProgressRing
              value={20}
              size={76}
              strokeWidth={7}
              circleClassName="text-cyan-500"
            >
              <span className="text-xs font-black text-foreground">20%</span>
            </ProgressRing>
            <span className="text-xs font-bold text-foreground mt-3">Healthy Fats</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Hormone balance support</span>
          </div>
        </div>
      </Card>

      {/* Prominent Visual AI Coach Banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 end-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-white">
                  FitLife AI Fitness Coach
                </h3>
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 2 Flagship
                </Badge>
              </div>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                24/7 conversational coaching reasoning on your Phase 1 physical metrics, available equipment, and dietary restrictions.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            onClick={() => setShowAiModal(true)}
            className="w-full md:w-auto text-xs font-bold px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 shadow-lg shadow-black/30"
          >
            <span>Preview AI Coach</span>
            <ArrowRight className={`h-4 w-4 ms-2 ${isRtl ? "rotate-180" : ""}`} />
          </Button>
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
              Visual roadmap preview (Phase 2 modules)
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
                  Phase 2
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
                  <span>Unlocks in Phase 2</span>
                </span>
              </div>
            </div>
          </div>

          {/* Nutrition Card */}
          <div id="nutrition" className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="relative h-44 overflow-hidden bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop"
                alt="Pakistani & Global Meal Plans"
                className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <div className="absolute top-3 end-3">
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 2
                </Badge>
              </div>
              <div className="absolute bottom-3 start-4">
                <div className="h-9 w-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md">
                  <Utensils className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="p-5 pt-2">
              <h3 className="text-sm font-extrabold text-foreground">
                Pakistani & Global Nutrition
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {t.dashboard.nutritionDesc}
              </p>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span>Calorie plans activate in Phase 2</span>
                </span>
              </div>
            </div>
          </div>

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
                  Phase 2
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
                  <span>Charts unlock in Phase 2</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Preview Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-card p-6 shadow-2xl relative text-start overflow-hidden">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  FitLife {t.common.aiCoach}
                </h3>
                <Badge variant="comingSoon" className="text-[10px]">
                  Phase 2 Preview
                </Badge>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden mb-4 border border-border/80 h-32 bg-slate-900 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop"
                alt="AI Fitness Companion"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                loading="lazy"
              />
              <div className="relative z-10 text-center px-4">
                <span className="text-xs font-bold text-white drop-shadow">
                  Phase 2 Architecture Ready
                </span>
                <p className="text-[11px] text-emerald-300 mt-1">
                  Ready to connect with reasoning agent models
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

      <main className="flex-1 container px-4 sm:px-8 py-8 max-w-6xl mx-auto">
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <DashboardContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
