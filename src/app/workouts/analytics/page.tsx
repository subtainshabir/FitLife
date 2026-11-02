"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Calendar,
  Flame,
  Dumbbell,
  Clock,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  RotateCw,
  BarChart2,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

export default function WorkoutAnalyticsPage() {
  const { language } = useI18n();
  const isUr = language === "ur";

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Progressive Overload Deep Dive
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [progressionData, setProgressionData] = useState<any | null>(null);
  const [loadingProgression, setLoadingProgression] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState<any[]>([]);

  // 1. Fetch Analytics & Personal Records
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [analyticsRes, prRes, exRes] = await Promise.all([
          fetch("/api/v1/workouts/analytics"),
          fetch("/api/v1/workouts/personal-records"),
          fetch("/api/v1/exercises?limit=50"),
        ]);

        if (analyticsRes.ok) {
          const aJson = await analyticsRes.json();
          setAnalytics(aJson.data);
        }

        if (prRes.ok) {
          const prJson = await prRes.json();
          setPersonalRecords(prJson.data || []);
        }

        if (exRes.ok) {
          const exJson = await exRes.json();
          const list = exJson.data?.exercises || exJson.data || [];
          setExerciseOptions(list);
          if (list.length > 0) {
            setSelectedExerciseId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 2. Load Progression Advice for Selected Exercise
  useEffect(() => {
    async function loadProgression() {
      if (!selectedExerciseId) return;
      try {
        setLoadingProgression(true);
        const res = await fetch(`/api/v1/workouts/progression?exerciseId=${selectedExerciseId}`);
        if (res.ok) {
          const json = await res.json();
          setProgressionData(json.data);
        }
      } catch (err) {
        console.error("Progression fetch error:", err);
      } finally {
        setLoadingProgression(false);
      }
    }

    loadProgression();
  }, [selectedExerciseId]);

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <RotateCw className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm">Compiling workout analytics...</p>
      </div>
    );
  }

  const { summary, volumeTimeline, weeklyFrequency, muscleDistribution } = analytics;

  // Max volume for scaling volume chart
  const maxVolume = Math.max(
    ...volumeTimeline.map((item: any) => item.volumeKg),
    100
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-white">
              <Link href="/workouts">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-7 w-7 text-emerald-400" />
                {isUr ? "ورزش کے تجزیات اور ریکارڈز" : "Workout Analytics & Progression"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {isUr
                  ? "حجم، تعدد، پٹھوں کا توازن اور ترقیاتی اوورلوڈ کی سفارشات"
                  : "Volume load trends, consistency metrics, and progressive overload recommendations."}
              </p>
            </div>
          </div>

          <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md">
            <Link href="/workouts">
              {isUr ? "معمولات دیکھیں" : "Workout Hub"}
            </Link>
          </Button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Workouts</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              {summary.totalWorkouts}
            </p>
            <span className="text-[10px] text-emerald-400">Sessions</span>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Volume</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              {summary.totalVolumeKg >= 1000
                ? `${(summary.totalVolumeKg / 1000).toFixed(1)}t`
                : `${summary.totalVolumeKg}kg`}
            </p>
            <span className="text-[10px] text-slate-400">{summary.totalVolumeKg} kg lifted</span>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Sets</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              {summary.totalSets}
            </p>
            <span className="text-[10px] text-slate-400">{summary.totalReps} total reps</span>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Time Active</span>
            <p className="text-2xl font-extrabold text-white mt-1">
              {summary.totalDurationMinutes}m
            </p>
            <span className="text-[10px] text-slate-400">Avg {summary.averageSessionDurationMinutes}m/session</span>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Calories Burned</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">
              {summary.totalCaloriesBurned}
            </p>
            <span className="text-[10px] text-slate-400">Estimated kcal</span>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Personal Records</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">
              {summary.totalPersonalRecords}
            </p>
            <span className="text-[10px] text-amber-400/80">PRs Unlocked</span>
          </Card>
        </div>

        {/* Section 1: Volume Load Progression Chart */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-400" />
                {isUr ? "حجم کا تدریجی گراف (کلوگرام)" : "Volume Load Progression (kg)"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {isUr
                  ? "ہر مکمل شدہ ورزش کے لیے مجموعی اٹھایا گیا وزن"
                  : "Total weight load lifted across recent completed workout sessions."}
              </CardDescription>
            </div>
            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs">
              Monitored Progressive Overload
            </Badge>
          </div>

          {volumeTimeline.length === 0 ? (
            <div className="h-44 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              Complete your first workout to see your volume progression chart.
            </div>
          ) : (
            <div className="space-y-2">
              {/* SVG Area / Bar Chart */}
              <div className="h-52 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
                {volumeTimeline.map((item: any, idx: number) => {
                  const heightPercent = Math.max(8, Math.round((item.volumeKg / maxVolume) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-12 z-20 pointer-events-none rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white shadow-xl whitespace-nowrap">
                        <span className="font-bold text-emerald-400">{item.volumeKg} kg</span> • {item.sessionName}
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-80 group-hover:opacity-100 transition shadow-sm"
                      />
                      <span className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[45px]">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Frequency & Muscle Distribution Dual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consistency & Weekly Frequency */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              {isUr ? "ہفتہ وار تسلسل اور حاضری" : "Weekly Consistency & Frequency"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {isUr
                ? "شیڈول کے مطابق ورزشوں کی تکمیل کی شرح"
                : "Completion performance versus your scheduled training targets."}
            </CardDescription>

            <div className="space-y-3 pt-2">
              {weeklyFrequency.map((week: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">{week.label}</span>
                    <span className="text-slate-400 font-mono">
                      {week.count} / {week.target} workouts ({week.completionRate}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      style={{ width: `${week.completionRate}%` }}
                      className={`h-full rounded-full transition-all ${
                        week.completionRate >= 100
                          ? "bg-emerald-500"
                          : week.completionRate >= 50
                          ? "bg-amber-500"
                          : "bg-slate-700"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Muscle Group Distribution */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-400" />
              {isUr ? "پٹھوں کے گروپس میں تقسیم" : "Muscle Group Volume Distribution"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {isUr
                ? "مختلف پٹھوں پر کیے گئے سیٹس کا تناسب"
                : "Relative volume share across targeted anatomical muscle groups."}
            </CardDescription>

            <div className="space-y-2.5 pt-2 max-h-56 overflow-y-auto pr-1">
              {muscleDistribution.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-slate-300 w-28 truncate">{m.muscle}</span>
                  <div className="flex-1 mx-3 h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      style={{ width: `${m.percentage}%` }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                  <span className="font-mono text-slate-400 w-16 text-right">
                    {m.setCount} sets ({m.percentage}%)
                  </span>
                </div>
              ))}

              {muscleDistribution.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">
                  Log sets to view muscle volume distribution.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Section 3: Progressive Overload Recommendation Deep Dive */}
        <Card className="border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                {isUr ? "ترقیاتی اوورلوڈ ایڈوائزر" : "Progressive Overload Advisor"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                {isUr
                  ? "کسی بھی ورزش کا انتخاب کریں تاکہ اگلی ورزش کے لیے مخصوص رہنمائی حاصل ہو"
                  : "Select an exercise to receive evidence-based progression targets for your next session."}
              </CardDescription>
            </div>

            {/* Exercise Selector */}
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-xs"
            >
              {exerciseOptions.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {isUr && ex.nameUr ? ex.nameUr : ex.nameEn}
                </option>
              ))}
            </select>
          </div>

          {loadingProgression ? (
            <div className="h-28 flex items-center justify-center text-slate-500 text-xs">
              <RotateCw className="h-4 w-4 animate-spin mr-2 text-emerald-400" />
              Evaluating performance data...
            </div>
          ) : progressionData ? (
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs uppercase mb-1.5"
                  >
                    {progressionData.recommendation.action.replace("_", " ")}
                  </Badge>
                  <h3 className="text-lg font-bold text-white">
                    {isUr
                      ? progressionData.recommendation.headlineUr
                      : progressionData.recommendation.headlineEn}
                  </h3>
                </div>

                {progressionData.recommendation.suggestedWeightKg > 0 && (
                  <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-2 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Suggested Load</span>
                    <p className="font-mono text-xl font-black text-emerald-400">
                      {progressionData.recommendation.suggestedWeightKg} kg
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                {isUr
                  ? progressionData.recommendation.rationaleUr
                  : progressionData.recommendation.rationaleEn}
              </p>
            </div>
          ) : null}
        </Card>

        {/* Section 4: Personal Records Showcase */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              {isUr ? "ذاتی ریکارڈز کی ٹرافی گیلری" : "Personal Records Trophy Showcase"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalRecords.map((item: any) => (
              <Card key={item.exerciseId} className="border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div>
                  <Badge
                    variant="outline"
                    className="border-slate-700 bg-slate-800 text-[10px] uppercase font-semibold text-slate-300 mb-1"
                  >
                    {item.primaryMuscle?.replace("_", " ")}
                  </Badge>
                  <h4 className="text-sm font-bold text-white">
                    {isUr && item.exerciseNameUr ? item.exerciseNameUr : item.exerciseNameEn}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {item.records.map((r: any) => (
                    <div
                      key={r.id}
                      className="rounded-lg bg-slate-950/70 border border-slate-800 p-2 text-center"
                    >
                      <span className="text-[10px] uppercase text-slate-400 block">
                        {r.recordType.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {r.metricDisplay}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {personalRecords.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                Log completed working sets to establish your first personal records!
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

