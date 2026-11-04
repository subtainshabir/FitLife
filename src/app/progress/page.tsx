"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import {
  Scale,
  Ruler,
  Camera,
  LineChart as LineChartIcon,
  Trophy,
  FileText,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Loader2,
  Trash2,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { WeightChart } from "@/components/progress/weight-chart";
import { MeasurementsChart } from "@/components/progress/measurements-chart";
import { AnalyticsCharts } from "@/components/progress/analytics-charts";
import { LogWeightModal } from "@/components/progress/log-weight-modal";
import { LogMeasurementModal } from "@/components/progress/log-measurement-modal";
import { UploadPhotoModal } from "@/components/progress/upload-photo-modal";
import { PhotoComparator } from "@/components/progress/photo-comparator";

function ProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t, isRtl } = useI18n();

  // Active tab state
  const tabParam = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  // Unit preferences: metric (kg, cm) vs imperial (lbs, in)
  const [displayUnit, setDisplayUnit] = useState<"metric" | "imperial">("metric");

  // Analytics timeframe
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");

  // Reports period
  const [reportPeriod, setReportPeriod] = useState<"7_days" | "30_days" | "90_days">("30_days");

  // Modals state
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<any | null>(null);
  const [logMeasurementOpen, setLogMeasurementOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<any | null>(null);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [comparatorOpen, setComparatorOpen] = useState(false);

  // Data states
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any | null>(null);
  const [weightData, setWeightData] = useState<any | null>(null);
  const [measurementData, setMeasurementData] = useState<any | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/progress?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/progress");
      return;
    }

    if (status === "authenticated") {
      loadAllProgressData();
    }
  }, [status]);

  async function loadAllProgressData() {
    setLoading(true);
    try {
      const [overviewRes, weightRes, measRes, photosRes, analyticsRes, milesRes, reportRes] =
        await Promise.all([
          fetch("/api/v1/progress/overview"),
          fetch("/api/v1/progress/weight"),
          fetch("/api/v1/progress/measurements"),
          fetch("/api/v1/progress/photos"),
          fetch(`/api/v1/progress/analytics?timeframe=${analyticsTimeframe}`),
          fetch("/api/v1/progress/milestones"),
          fetch(`/api/v1/progress/reports?period=${reportPeriod}`),
        ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (weightRes.ok) setWeightData(await weightRes.json());
      if (measRes.ok) setMeasurementData(await measRes.json());
      if (photosRes.ok) {
        const pJson = await photosRes.json();
        setPhotos(pJson.photos || []);
      }
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (milesRes.ok) {
        const mJson = await milesRes.json();
        setMilestones(mJson.milestones || []);
      }
      if (reportRes.ok) {
        const rJson = await reportRes.json();
        setReport(rJson.report || null);
      }
    } catch (err) {
      console.error("Failed to load progress data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Refresh single sections
  async function refreshWeight() {
    const res = await fetch("/api/v1/progress/weight");
    if (res.ok) setWeightData(await res.json());
    const oRes = await fetch("/api/v1/progress/overview");
    if (oRes.ok) setOverview(await oRes.json());
    const aRes = await fetch(`/api/v1/progress/analytics?timeframe=${analyticsTimeframe}`);
    if (aRes.ok) setAnalytics(await aRes.json());
  }

  async function refreshMeasurements() {
    const res = await fetch("/api/v1/progress/measurements");
    if (res.ok) setMeasurementData(await res.json());
    const oRes = await fetch("/api/v1/progress/overview");
    if (oRes.ok) setOverview(await oRes.json());
    const aRes = await fetch(`/api/v1/progress/analytics?timeframe=${analyticsTimeframe}`);
    if (aRes.ok) setAnalytics(await aRes.json());
  }

  async function refreshPhotos() {
    const res = await fetch("/api/v1/progress/photos");
    if (res.ok) {
      const pJson = await res.json();
      setPhotos(pJson.photos || []);
    }
    const oRes = await fetch("/api/v1/progress/overview");
    if (oRes.ok) setOverview(await oRes.json());
  }

  async function handleDeleteWeight(id: string) {
    if (!confirm(isRtl ? "کیا آپ واقعی یہ اندراج حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this weight log?")) return;
    try {
      const res = await fetch(`/api/v1/progress/weight/${id}`, { method: "DELETE" });
      if (res.ok) refreshWeight();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteMeasurement(id: string) {
    if (!confirm(isRtl ? "کیا آپ واقعی یہ پیمائش حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this measurement log?")) return;
    try {
      const res = await fetch(`/api/v1/progress/measurements/${id}`, { method: "DELETE" });
      if (res.ok) refreshMeasurements();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeletePhoto(id: string) {
    if (!confirm(isRtl ? "کیا آپ واقعی یہ تصویر حذف کرنا چاہتے ہیں؟" : "Are you sure you want to delete this transformation photo?")) return;
    try {
      const res = await fetch(`/api/v1/progress/photos/${id}`, { method: "DELETE" });
      if (res.ok) refreshPhotos();
    } catch (err) {
      console.error(err);
    }
  }

  const isImperial = displayUnit === "imperial";
  const weightUnit = isImperial ? "lbs" : "kg";
  const lengthUnit = isImperial ? "in" : "cm";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="text-sm font-semibold text-muted-foreground">
              {isRtl ? "پیش رفت لوڈ کی جا رہی ہے..." : "Loading transformation analytics..."}
            </span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 container max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-bold">
                Phase 8 Live
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                FitLife Analytics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {isRtl ? "جسمانی تبدیلی اور پیش رفت" : "Body Transformation & Analytics"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isRtl
                ? "وزن کی تاریخ، جسمانی پیمائشیں، تصویری جرنل اور مستقل مزاجی کا سائنسی جائزہ"
                : "Comprehensive weight history, circumference changes, visual photo journal, and habit trends"}
            </p>
          </div>

          {/* Unit Toggle & Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex rounded-xl border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setDisplayUnit("metric")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  displayUnit === "metric"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Metric (kg, cm)
              </button>
              <button
                type="button"
                onClick={() => setDisplayUnit("imperial")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  displayUnit === "imperial"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Imperial (lbs, in)
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
          {[
            { id: "overview", labelEn: "Overview", labelUr: "خلاصہ", icon: Sparkles },
            { id: "weight", labelEn: "Weight Tracker", labelUr: "وزن کی تاریخ", icon: Scale },
            { id: "measurements", labelEn: "Measurements", labelUr: "جسمانی پیمائشیں", icon: Ruler },
            { id: "photos", labelEn: "Photo Journal", labelUr: "تصویری جرنل", icon: Camera },
            { id: "analytics", labelEn: "Consistency", labelUr: "تجزیات و عادات", icon: LineChartIcon },
            { id: "milestones", labelEn: "Milestones", labelUr: "سنگ میل", icon: Trophy },
            { id: "reports", labelEn: "Reports & Export", labelUr: "رپورٹس و ڈاؤن لوڈ", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{isRtl ? tab.labelUr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW DASHBOARD
        ========================================================================= */}
        {activeTab === "overview" && overview && (
          <div className="space-y-6">
            {/* Core Transformation Hero Card */}
            <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-emerald-500/5 p-5 sm:p-7 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                {/* Weight Triad: Starting -> Current -> Target */}
                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Starting */}
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      {isRtl ? "ابتدائی وزن" : "Starting Weight"}
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-foreground">
                      {overview.weight.startingKg !== null
                        ? isImperial
                          ? `${overview.weight.startingLbs} lbs`
                          : `${overview.weight.startingKg} kg`
                        : "—"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {isRtl ? "پہلا ریکارڈ" : "Baseline record"}
                    </span>
                  </div>

                  {/* Current */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 relative overflow-hidden">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      {isRtl ? "موجودہ وزن" : "Current Weight"}
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-foreground">
                      {overview.weight.currentKg !== null
                        ? isImperial
                          ? `${overview.weight.currentLbs} lbs`
                          : `${overview.weight.currentKg} kg`
                        : "—"}
                    </div>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                      {isRtl ? "تازہ ترین وزن" : "Latest entry"}
                    </span>
                  </div>

                  {/* Target */}
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      {isRtl ? "ہدف وزن" : "Target Goal"}
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-foreground">
                      {overview.weight.targetKg !== null
                        ? isImperial
                          ? `${overview.weight.targetLbs} lbs`
                          : `${overview.weight.targetKg} kg`
                        : "—"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {overview.goal ? overview.goal.goalType.replace("_", " ") : (isRtl ? "ہدف مقرر نہیں" : "No active goal")}
                    </span>
                  </div>

                  {/* Net Delta */}
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      {isRtl ? "کل تبدیلی" : "Net Change"}
                    </span>
                    <div className={`text-xl sm:text-2xl font-black flex items-center gap-1 ${
                      overview.weight.netChangeKg < 0 ? "text-cyan-500" : overview.weight.netChangeKg > 0 ? "text-emerald-500" : "text-foreground"
                    }`}>
                      {overview.weight.netChangeKg < 0 ? (
                        <TrendingDown className="h-5 w-5" />
                      ) : overview.weight.netChangeKg > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <Minus className="h-5 w-5" />
                      )}
                      <span>
                        {overview.weight.netChangeKg > 0 ? "+" : ""}
                        {isImperial ? `${overview.weight.netChangeLbs} lbs` : `${overview.weight.netChangeKg} kg`}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {overview.weight.weeklyRateKg !== 0 ? (
                        `${overview.weight.weeklyRateKg > 0 ? "+" : ""}${isImperial ? Math.round(overview.weight.weeklyRateKg * 2.20462 * 10) / 10 : overview.weight.weeklyRateKg} ${weightUnit}/wk`
                      ) : (
                        isRtl ? "ابتدائی مرحلہ" : "Starting baseline"
                      )}
                    </span>
                  </div>
                </div>

                {/* Circular Goal Progress Indicator */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-border/60 text-center">
                  <div className="relative flex items-center justify-center h-28 w-28">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-muted stroke-[8] fill-none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-emerald-500 stroke-[8] fill-none transition-all duration-700 stroke-linecap-round"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={
                          2 * Math.PI * 40 * (1 - (Math.min(100, overview.weight.progressPercentage || 0) / 100))
                        }
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-black text-foreground">
                        {overview.weight.progressPercentage !== null ? `${overview.weight.progressPercentage}%` : "0%"}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">
                        {isRtl ? "ہدف مکمل" : "Goal Progress"}
                      </span>
                    </div>
                  </div>

                  {overview.goal && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      <span>{overview.goal.daysElapsed} {isRtl ? "دن ہوئے" : "days since start"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-6 pt-5 border-t border-border/60 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    setEditingWeight(null);
                    setLogWeightOpen(true);
                  }}
                  className="rounded-xl text-xs font-bold h-9 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                >
                  <Scale className="h-3.5 w-3.5 me-1.5" />
                  {isRtl ? "نیا وزن ریکارڈ کریں" : "Log Weight"}
                </Button>

                <Button
                  onClick={() => {
                    setEditingMeasurement(null);
                    setLogMeasurementOpen(true);
                  }}
                  variant="outline"
                  className="rounded-xl text-xs font-bold h-9"
                >
                  <Ruler className="h-3.5 w-3.5 me-1.5 text-cyan-500" />
                  {isRtl ? "پیمائشیں درج کریں" : "Record Measurements"}
                </Button>

                <Button
                  onClick={() => setUploadPhotoOpen(true)}
                  variant="outline"
                  className="rounded-xl text-xs font-bold h-9"
                >
                  <Camera className="h-3.5 w-3.5 me-1.5 text-amber-500" />
                  {isRtl ? "تصویر اپ لوڈ کریں" : "Upload Photo"}
                </Button>

                {photos.length >= 2 && (
                  <Button
                    onClick={() => setComparatorOpen(true)}
                    variant="secondary"
                    className="rounded-xl text-xs font-bold h-9 ms-auto"
                  >
                    <Sparkles className="h-3.5 w-3.5 me-1.5 text-emerald-500" />
                    {isRtl ? "پہلے اور بعد کا موازنہ" : "Compare Before & After"}
                  </Button>
                )}
              </div>
            </div>

            {/* Circumferences Quick Glance Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  {isRtl ? "جسمانی پیمائشوں کا خلاصہ" : "Circumference Changes"}
                </h3>
                <button
                  onClick={() => handleTabChange("measurements")}
                  className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1"
                >
                  <span>{isRtl ? "تمام پیمائشیں دیکھیں" : "View all measurements"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { key: "waistCm", labelEn: "Waist", labelUr: "کمر", val: overview.measurements.latest?.waistCm },
                  { key: "chestCm", labelEn: "Chest", labelUr: "سینہ", val: overview.measurements.latest?.chestCm },
                  { key: "armCm", labelEn: "Arms", labelUr: "بازو", val: overview.measurements.latest?.armCm },
                  { key: "hipCm", labelEn: "Hips", labelUr: "کولہے", val: overview.measurements.latest?.hipCm },
                ].map((item) => {
                  const delta = overview.measurements.deltas[item.key];
                  const displayVal = item.val
                    ? isImperial
                      ? Math.round((item.val / 2.54) * 10) / 10
                      : item.val
                    : null;
                  const deltaVal = delta ? (isImperial ? delta.in : delta.cm) : null;

                  return (
                    <div key={item.key} className="rounded-2xl border border-border/60 bg-card p-4">
                      <span className="text-xs text-muted-foreground font-semibold block mb-1">
                        {isRtl ? item.labelUr : item.labelEn}
                      </span>
                      <div className="text-lg sm:text-xl font-black text-foreground">
                        {displayVal !== null ? `${displayVal} ${lengthUnit}` : "—"}
                      </div>
                      {deltaVal !== null && deltaVal !== undefined ? (
                        <div className={`text-[11px] font-bold mt-1 flex items-center gap-0.5 ${
                          deltaVal < 0 ? "text-cyan-500" : deltaVal > 0 ? "text-emerald-500" : "text-muted-foreground"
                        }`}>
                          <span>{deltaVal > 0 ? `+${deltaVal}` : deltaVal} {lengthUnit}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({isRtl ? "گزشتہ سے" : "vs prev"})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          {isRtl ? "پہلا ریکارڈ" : "Baseline"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consistency & Habit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Workouts */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block">
                    {isRtl ? "گزشتہ 30 دن کی ورزشیں" : "Workouts (Last 30 Days)"}
                  </span>
                  <div className="text-2xl font-black text-foreground mt-1">
                    {overview.workouts.past30DaysCount}
                  </div>
                  <span className="text-[11px] text-cyan-500 font-semibold">
                    {overview.workouts.trainingConsistencyPercent}% {isRtl ? "تربیتی تسلسل" : "consistency"}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <LineChartIcon className="h-5 w-5" />
                </div>
              </div>

              {/* Nutrition */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block">
                    {isRtl ? "اوسط روزانہ کیلوریز" : "Avg Daily Calories (7d)"}
                  </span>
                  <div className="text-2xl font-black text-foreground mt-1">
                    {overview.nutrition.averageCalories > 0 ? `${overview.nutrition.averageCalories} kcal` : "—"}
                  </div>
                  <span className="text-[11px] text-emerald-500 font-semibold">
                    {overview.nutrition.averageProtein > 0 ? `${overview.nutrition.averageProtein}g protein` : (isRtl ? "ڈائری ریکارڈ کریں" : "Log food diary")}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Scale className="h-5 w-5" />
                </div>
              </div>

              {/* Milestones */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block">
                    {isRtl ? "حاصل کردہ سنگ میل" : "Milestones Achieved"}
                  </span>
                  <div className="text-2xl font-black text-foreground mt-1">
                    {overview.milestones.totalAchieved} / {overview.milestones.totalCount}
                  </div>
                  <span className="text-[11px] text-amber-500 font-semibold">
                    {isRtl ? "تمام کامیابیاں دیکھیں" : "View achievements"}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: WEIGHT TRACKER
        ========================================================================= */}
        {activeTab === "weight" && weightData && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRtl ? "وزن کی پیش رفت اور رجحان" : "Weight Progress Trend"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "ہدف اور ابتدائی وزن کے ساتھ انٹرایکٹو چارٹ" : "Historical curve with target and start reference baselines"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingWeight(null);
                    setLogWeightOpen(true);
                  }}
                  className="rounded-xl text-xs font-bold h-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Plus className="h-3.5 w-3.5 me-1" />
                  {isRtl ? "نیا وزن ریکارڈ کریں" : "Log Weight"}
                </Button>
              </div>

              {/* Recharts Area Chart */}
              <WeightChart
                data={weightData.history}
                targetWeightKg={weightData.targetWeightKg}
                startWeightKg={weightData.startingWeightKg}
                unit={weightUnit}
                isRtl={isRtl}
              />
            </div>

            {/* Weight History Table */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? "وزن کا تفصیلی ریکارڈ" : "Weight History Logs"} ({weightData.totalEntries})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3 text-start">{isRtl ? "تاریخ" : "Date"}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "وزن (kg)" : "Weight (kg)"}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "وزن (lbs)" : "Weight (lbs)"}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "ذریعہ" : "Source"}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "نوٹس" : "Notes"}</th>
                      <th className="py-2.5 px-3 text-end">{isRtl ? "کارروائی" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {weightData.history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          {isRtl ? "وزن کا کوئی ریکارڈ موجود نہیں ہے۔" : "No weight records found."}
                        </td>
                      </tr>
                    ) : (
                      weightData.history.slice().reverse().map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {entry.recordedAt.split("T")[0]}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-500">
                            {entry.weightKg} kg
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {entry.weightLbs} lbs
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {entry.source}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground italic max-w-xs truncate">
                            {entry.notes || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingWeight(entry);
                                  setLogWeightOpen(true);
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground rounded"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWeight(entry.id)}
                                className="p-1 text-muted-foreground hover:text-destructive rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BODY MEASUREMENTS
        ========================================================================= */}
        {activeTab === "measurements" && measurementData && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRtl ? "جسمانی پیمائشوں کا ٹائم لائن چارٹ" : "Circumference Progression Chart"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? "کمر، سینہ، بازو اور دیگر پیمائشوں کا وقت کے ساتھ جائزہ" : "Compare waist, chest, arms, and hip changes over time"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingMeasurement(null);
                    setLogMeasurementOpen(true);
                  }}
                  className="rounded-xl text-xs font-bold h-9 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5 me-1" />
                  {isRtl ? "پیمائش درج کریں" : "Record Measurements"}
                </Button>
              </div>

              <MeasurementsChart
                data={measurementData.records.slice().reverse().map((r: any) => ({
                  date: r.recordedAt.split("T")[0],
                  waistCm: r.waistCm,
                  chestCm: r.chestCm,
                  hipCm: r.hipCm,
                  armCm: r.armCm,
                  thighCm: r.thighCm,
                  neckCm: r.neckCm,
                  bodyFatPercentage: r.bodyFatPercentage,
                  waistIn: r.waistCm ? Math.round((r.waistCm / 2.54) * 10) / 10 : null,
                  chestIn: r.chestCm ? Math.round((r.chestCm / 2.54) * 10) / 10 : null,
                  armIn: r.armCm ? Math.round((r.armCm / 2.54) * 10) / 10 : null,
                  hipIn: r.hipCm ? Math.round((r.hipCm / 2.54) * 10) / 10 : null,
                }))}
                unit={lengthUnit}
                isRtl={isRtl}
              />
            </div>

            {/* Measurements History Table */}
            <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-foreground">
                {isRtl ? "پیمائش کا تاریخی ریکارڈ" : "Measurement History Records"} ({measurementData.totalRecords})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3 text-start">{isRtl ? "تاریخ" : "Date"}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "کمر" : `Waist (${lengthUnit})`}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "سینہ" : `Chest (${lengthUnit})`}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "کولہے" : `Hips (${lengthUnit})`}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "بازو" : `Arms (${lengthUnit})`}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "چربی %" : "Body Fat %"}</th>
                      <th className="py-2.5 px-3 text-start">{isRtl ? "نوٹس" : "Notes"}</th>
                      <th className="py-2.5 px-3 text-end">{isRtl ? "کارروائی" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {measurementData.records.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          {isRtl ? "پیمائش کا کوئی ریکارڈ موجود نہیں ہے۔" : "No circumference records found."}
                        </td>
                      </tr>
                    ) : (
                      measurementData.records.map((entry: any) => {
                        const fmt = (cm: number | null) => {
                          if (cm === null || cm === undefined) return "—";
                          return isImperial ? Math.round((cm / 2.54) * 10) / 10 : cm;
                        };
                        return (
                          <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {entry.recordedAt.split("T")[0]}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                              {fmt(entry.waistCm)}
                            </td>
                            <td className="py-2.5 px-3">{fmt(entry.chestCm)}</td>
                            <td className="py-2.5 px-3">{fmt(entry.hipCm)}</td>
                            <td className="py-2.5 px-3">{fmt(entry.armCm)}</td>
                            <td className="py-2.5 px-3 text-amber-500 font-semibold">
                              {entry.bodyFatPercentage ? `${entry.bodyFatPercentage}%` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground italic max-w-xs truncate">
                              {entry.notes || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingMeasurement(entry);
                                    setLogMeasurementOpen(true);
                                  }}
                                  className="p-1 text-muted-foreground hover:text-foreground rounded"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeasurement(entry.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive rounded"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: PHOTO JOURNAL & COMPARISON
        ========================================================================= */}
        {activeTab === "photos" && (
          <div className="space-y-6">
            {/* Privacy Guarantee Banner */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground">
                    {isRtl ? "نجی تصویری جرنل کی سیکیورٹی کی یقین دہانی" : "Private & Encrypted Photo Journal"}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isRtl
                      ? "تصاویر صرف آپ کے لیے محفوظ کی جاتی ہیں۔ وہ کبھی پبلک نہیں ہوتیں اور نہ ہی AI ماڈلز یا تیسری پارٹیوں کو دی جاتی ہیں۔"
                      : "Photos are stored in private authorized storage. No public URLs, no facial recognition, and never used for AI training."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setUploadPhotoOpen(true)}
                  className="rounded-xl text-xs font-bold h-9 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Camera className="h-3.5 w-3.5 me-1.5" />
                  {isRtl ? "تصویر اپ لوڈ کریں" : "Upload Photo"}
                </Button>
                {photos.length >= 2 && (
                  <Button
                    onClick={() => setComparatorOpen(true)}
                    variant="outline"
                    className="rounded-xl text-xs font-bold h-9"
                  >
                    <Sparkles className="h-3.5 w-3.5 me-1.5 text-emerald-500" />
                    {isRtl ? "موازنہ کریں" : "Compare"}
                  </Button>
                )}
              </div>
            </div>

            {/* Photos Grid */}
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-3xl border border-border/70 bg-card p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Camera className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {isRtl ? "ابھی تک کوئی تصویر اپ لوڈ نہیں کی گئی" : "No transformation photos yet"}
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {isRtl
                    ? "اپنی پہلی تصویر اپ لوڈ کر کے جسمانی تبدیلی کا بصری ریکارڈ محفوظ کریں۔"
                    : "Upload your first progress photo to start your visual transformation journal."}
                </p>
                <Button
                  onClick={() => setUploadPhotoOpen(true)}
                  className="rounded-xl text-xs font-bold h-9 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Plus className="h-3.5 w-3.5 me-1" />
                  {isRtl ? "پہلی تصویر اپ لوڈ کریں" : "Upload First Photo"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-3xl border border-border/70 bg-card overflow-hidden shadow-sm flex flex-col group"
                  >
                    <div className="relative h-64 bg-slate-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={photo.fileUrl}
                        alt="Progress entry"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 start-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase">
                        {photo.viewAngle}
                      </div>
                      {photo.isHidden && (
                        <div className="absolute top-2 end-2 bg-black/60 backdrop-blur-md text-amber-400 p-1 rounded-lg">
                          <EyeOff className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute bottom-2 end-2 bg-black/60 hover:bg-destructive text-white p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isRtl ? "حذف کریں" : "Delete photo"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          {photo.photoDate.split("T")[0]}
                        </span>
                        {photo.weightKg && (
                          <span className="text-emerald-500 font-bold">
                            {photo.weightKg} kg
                          </span>
                        )}
                      </div>
                      {photo.notes && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                          "{photo.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: ANALYTICS & CONSISTENCY (Phase 6 Workouts & Phase 7 Nutrition)
        ========================================================================= */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isRtl ? "تربیتی والیوم اور غذائی تسلسل" : "Workout & Nutrition Habits"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl
                    ? "فیز 6 ورک آؤٹ لاگز اور فیز 7 نیوٹریشن ڈائری کا تجزیاتی مطالعہ"
                    : "Real historical data from Phase 6 workouts and Phase 7 nutrition logs"}
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex rounded-xl border border-border p-0.5 bg-muted/40 text-xs">
                {(["7d", "30d", "90d"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      setAnalyticsTimeframe(tf);
                      fetch(`/api/v1/progress/analytics?timeframe=${tf}`)
                        .then((res) => res.json())
                        .then((d) => setAnalytics(d));
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      analyticsTimeframe === tf
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <AnalyticsCharts
              workoutData={analytics.workoutSeries || []}
              nutritionData={analytics.nutritionSeries || []}
              isRtl={isRtl}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 6: GOAL MILESTONES
        ========================================================================= */}
        {activeTab === "milestones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isRtl ? "کامیابیاں اور فٹنس کے سنگ میل" : "Fitness Achievements & Milestones"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "حقیقی پیش رفت پر مبنی سنگ میل" : "Based on recorded workouts, weight changes, and nutrition habits"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-3xl border p-5 shadow-sm transition-all ${
                    m.isAchieved
                      ? "border-emerald-500/40 bg-gradient-to-br from-card to-emerald-500/10 shadow-emerald-500/5"
                      : "border-border/70 bg-card opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                      m.isAchieved
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Trophy className="h-5 w-5" />
                    </div>
                    {m.isAchieved ? (
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                        {isRtl ? "مکمل ہوا ✓" : "Achieved ✓"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                        {isRtl ? "جاری ہے" : "In Progress"}
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-foreground mb-1">
                    {isRtl ? m.titleUr : m.titleEn}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {isRtl ? m.descriptionUr : m.descriptionEn}
                  </p>

                  {/* Target & Current */}
                  {m.targetValue && (
                    <div className="space-y-1.5 pt-1 border-t border-border/40">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          {isRtl ? "پیش رفت:" : "Progress:"}
                        </span>
                        <span className="font-bold text-foreground">
                          {m.currentValue || 0} / {m.targetValue} {m.unit || ""}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round(((m.currentValue || 0) / m.targetValue) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {m.achievedAt && (
                    <div className="mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>
                        {isRtl ? "تاریخ کامیابی:" : "Achieved on:"} {m.achievedAt.split("T")[0]}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: PROGRESS REPORTS & EXPORT
        ========================================================================= */}
        {activeTab === "reports" && report && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {isRtl ? "بصری پیش رفت کی رپورٹ" : "Visual Progress Report"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRtl ? "منتخب مدت کا جامع جائزہ، پرنٹ یا ڈاؤن لوڈ کریں" : "Summary of body metrics, workouts, and nutrition adherence"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="rounded-xl text-xs font-bold h-9"
                >
                  <Printer className="h-3.5 w-3.5 me-1.5" />
                  {isRtl ? "پرنٹ / PDF" : "Print / PDF"}
                </Button>

                <a
                  href="/api/v1/progress/export?format=csv"
                  download
                  className="inline-flex items-center justify-center rounded-xl text-xs font-bold h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                >
                  <Download className="h-3.5 w-3.5 me-1.5" />
                  {isRtl ? "ڈیٹا ڈاؤن لوڈ کریں (CSV)" : "Download CSV"}
                </a>
              </div>
            </div>

            {/* Formatted Report Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none">
              <div className="border-b border-border/60 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    FitLife AI Transformation Report
                  </span>
                  <h2 className="text-xl font-black text-foreground">
                    {session?.user?.name || "Athlete"} — {isRtl ? "تربیتی رپورٹ" : "Progress Summary"}
                  </h2>
                </div>
                <div className="text-xs text-muted-foreground">
                  {report.startDate.split("T")[0]} {isRtl ? "سے" : "to"} {report.endDate.split("T")[0]}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">
                    {isRtl ? "وزن میں تبدیلی" : "Weight Delta"}
                  </span>
                  <div className="text-xl font-black text-foreground">
                    {report.weight.weightChangeKg > 0 ? `+${report.weight.weightChangeKg}` : report.weight.weightChangeKg} kg
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {report.weight.startWeightKg} kg ➔ {report.weight.endWeightKg} kg
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">
                    {isRtl ? "کمر میں تبدیلی" : "Waist Delta"}
                  </span>
                  <div className="text-xl font-black text-cyan-500">
                    {report.measurements.waistChangeCm !== null
                      ? `${report.measurements.waistChangeCm > 0 ? "+" : ""}${report.measurements.waistChangeCm} cm`
                      : "—"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {report.measurements.totalEntries} {isRtl ? "پیمائشیں" : "checkpoints"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">
                    {isRtl ? "مکمل شدہ ورزشیں" : "Workouts Completed"}
                  </span>
                  <div className="text-xl font-black text-foreground">
                    {report.workouts.totalCompleted}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {report.workouts.totalVolumeKg.toLocaleString()} kg volume
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold block mb-1">
                    {isRtl ? "اوسط کیلوریز" : "Avg Calories"}
                  </span>
                  <div className="text-xl font-black text-emerald-500">
                    {report.nutrition.avgCalories ? `${report.nutrition.avgCalories} kcal` : "—"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {report.nutrition.loggedDays} {isRtl ? "دن ریکارڈ کیے" : "days tracked"}
                  </span>
                </div>
              </div>

              {/* Achieved Milestones in Period */}
              {report.achievedMilestones.length > 0 && (
                <div className="border-t border-border/60 pt-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {isRtl ? "اس مدت میں حاصل کردہ سنگ میل" : "Milestones Achieved During Period"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {report.achievedMilestones.map((m: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 text-xs">
                        🏆 {isRtl ? m.titleUr : m.titleEn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Action Modals */}
      <LogWeightModal
        isOpen={logWeightOpen}
        onClose={() => setLogWeightOpen(false)}
        onSuccess={refreshWeight}
        initialData={editingWeight}
        isRtl={isRtl}
      />

      <LogMeasurementModal
        isOpen={logMeasurementOpen}
        onClose={() => setLogMeasurementOpen(false)}
        onSuccess={refreshMeasurements}
        initialData={editingMeasurement}
        isRtl={isRtl}
      />

      <UploadPhotoModal
        isOpen={uploadPhotoOpen}
        onClose={() => setUploadPhotoOpen(false)}
        onSuccess={refreshPhotos}
        isRtl={isRtl}
      />

      <PhotoComparator
        isOpen={comparatorOpen}
        onClose={() => setComparatorOpen(false)}
        photos={photos}
        isRtl={isRtl}
      />

      <Footer />
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <ProgressContent />
    </Suspense>
  );
}
