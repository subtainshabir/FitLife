"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Calendar,
  Play,
  Plus,
  Clock,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  RotateCw,
  Copy,
  Edit,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

interface RoutineItem {
  id: string;
  name: string;
  nameUr?: string;
  description?: string;
  descriptionUr?: string;
  difficulty: string;
  targetDurationMinutes: number;
  splitType: string;
  tags: string[];
  isTemplate: boolean;
  exerciseCount: number;
  exercises: Array<{
    id: string;
    exercise: {
      id: string;
      nameEn: string;
      nameUr: string;
      primaryMuscle: string;
      trainingType: string;
    };
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    targetWeightKg: number;
  }>;
}

interface ScheduleDay {
  id: string | null;
  dayOfWeek: number;
  dayNameEn: string;
  dayNameUr: string;
  isRestDay: boolean;
  scheduledTime: string;
  routineId: string | null;
  routine: {
    id: string;
    name: string;
    nameUr?: string;
    difficulty: string;
    splitType: string;
    targetDurationMinutes: number;
  } | null;
}

export default function WorkoutsHubPage() {
  const router = useRouter();
  const { language } = useI18n();
  const isUr = language === "ur";

  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDay[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [recoveryData, setRecoveryData] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "my" | "templates">("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load initial hub data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch active session
        const activeRes = await fetch("/api/v1/workouts/sessions/active");
        if (activeRes.ok) {
          const json = await activeRes.json();
          if (json.data) setActiveSession(json.data);
        }

        // Fetch schedule
        const schedRes = await fetch("/api/v1/workouts/schedule");
        if (schedRes.ok) {
          const json = await schedRes.json();
          if (json.data) setSchedules(json.data);
        }

        // Fetch routines
        const routRes = await fetch("/api/v1/workouts/routines?type=all");
        if (routRes.ok) {
          const json = await routRes.json();
          if (json.data) setRoutines(json.data);
        }

        // Fetch muscle recovery check for common upper/lower muscles
        const recRes = await fetch("/api/v1/workouts/recovery-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetMuscles: ["chest", "back", "quadriceps", "shoulders", "biceps", "triceps"],
          }),
        });
        if (recRes.ok) {
          const json = await recRes.json();
          setRecoveryData(json.data);
        }
      } catch (err) {
        console.error("Failed to load workout data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Start workout from routine
  const handleStartWorkout = async (routine: RoutineItem) => {
    try {
      setActionLoading(routine.id);

      // Check recovery for routine muscles
      const routineMuscles = Array.from(
        new Set(routine.exercises.map((e) => e.exercise.primaryMuscle))
      );

      const recCheckRes = await fetch("/api/v1/workouts/recovery-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMuscles: routineMuscles }),
      });

      if (recCheckRes.ok) {
        const checkJson = await recCheckRes.json();
        if (checkJson.data?.hasFatiguedMuscles) {
          const confirmed = window.confirm(
            isUr
              ? `${checkJson.data.warningUr}\n\nکیا آپ پھر بھی ورزش شروع کرنا چاہتے ہیں؟`
              : `${checkJson.data.warningEn}\n\nDo you still wish to proceed?`
          );
          if (!confirmed) {
            setActionLoading(null);
            return;
          }
        }
      }

      // Start session
      const res = await fetch("/api/v1/workouts/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: routine.id,
          name: routine.name,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        router.push(`/workouts/session/${json.data.id}`);
      } else {
        alert("Failed to start workout. Please try again.");
      }
    } catch (err) {
      console.error("Error starting workout:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Duplicate routine
  const handleDuplicateRoutine = async (routineId: string) => {
    try {
      setActionLoading(`dup-${routineId}`);
      const res = await fetch(`/api/v1/workouts/routines/${routineId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        // Refresh routines
        const routRes = await fetch("/api/v1/workouts/routines?type=all");
        if (routRes.ok) {
          const rJson = await routRes.json();
          setRoutines(rJson.data);
        }
        alert(isUr ? "ورزش کامیابی سے نقل کر لی گئی!" : "Routine duplicated to your custom list!");
      }
    } catch (err) {
      console.error("Duplicate error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle rest day in schedule
  const handleToggleRestDay = async (day: ScheduleDay) => {
    try {
      const res = await fetch("/api/v1/workouts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: day.dayOfWeek,
          isRestDay: !day.isRestDay,
          routineId: !day.isRestDay ? null : routines[0]?.id || null,
        }),
      });
      if (res.ok) {
        const schedRes = await fetch("/api/v1/workouts/schedule");
        if (schedRes.ok) {
          const json = await schedRes.json();
          setSchedules(json.data);
        }
      }
    } catch (err) {
      console.error("Schedule update error:", err);
    }
  };

  const filteredRoutines = routines.filter((r) => {
    if (selectedTab === "my") return !r.isTemplate;
    if (selectedTab === "templates") return r.isTemplate;
    return true;
  });

  const todayIndex = new Date().getDay(); // 0 = Sun ... 6 = Sat
  const todaysSchedule = schedules.find((s) => s.dayOfWeek === todayIndex);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Active Workout Resumption Banner */}
        {activeSession && (
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-6 shadow-xl shadow-emerald-950/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  <Play className="h-7 w-7 fill-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {isUr ? "ورزش جاری ہے" : "Workout in Progress"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {activeSession.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isUr
                      ? `${activeSession.exercises?.length || 0} ورزشیں • سیٹ اور اوزان محفوظ ہیں`
                      : `${activeSession.exercises?.length || 0} Exercises • Sets & weights auto-saved`}
                  </p>
                </div>
              </div>

              <Button
                asChild
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-6 text-base shadow-lg shadow-emerald-500/25"
              >
                <Link href={`/workouts/session/${activeSession.id}`}>
                  {isUr ? "ورزش جاری رکھیں" : "Resume Workout"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {isUr ? "ورزش کا نظام الاوقات اور ٹریکنگ" : "Workout Planner & Tracking"}
                </h1>
                <p className="text-sm text-slate-400">
                  {isUr
                    ? "ذاتی معمولات بنائیں، سیٹ اور اوزان ٹریک کریں اور ترقیاتی اوورلوڈ حاصل کریں"
                    : "Build routines, log real-time sets with rest timers, and unlock progressive overload."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Button
              asChild
              variant="outline"
              className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200"
            >
              <Link href="/workouts/analytics">
                <TrendingUp className="mr-2 h-4 w-4 text-emerald-400" />
                {isUr ? "تجزیات اور ریکارڈز" : "Analytics & PRs"}
              </Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
            >
              <Link href="/workouts/builder">
                <Plus className="mr-2 h-4 w-4" />
                {isUr ? "نیا معمول بنائیں" : "New Routine"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Muscle Recovery Status Card */}
        {recoveryData?.hasFatiguedMuscles && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-300">
                {isUr ? "پٹھوں کی بحالی کا الرٹ: " : "Muscle Recovery Notice: "}
              </span>
              <span>
                {isUr ? recoveryData.warningUr : recoveryData.warningEn}
              </span>
            </div>
          </div>
        )}

        {/* Weekly Schedule Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">
                {isUr ? "ہفتہ وار شیڈول" : "Weekly Schedule"}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {isUr ? "آج:" : "Today:"}{" "}
              <strong className="text-emerald-400">
                {schedules[todayIndex]?.dayNameEn || "Today"}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {schedules.map((day) => {
              const isToday = day.dayOfWeek === todayIndex;
              return (
                <div
                  key={day.dayOfWeek}
                  className={`rounded-xl border p-3.5 flex flex-col justify-between transition ${
                    isToday
                      ? "border-emerald-500/80 bg-emerald-950/20 ring-1 ring-emerald-500/40"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold ${
                          isToday ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        {isUr ? day.dayNameUr : day.dayNameEn.slice(0, 3)}
                      </span>
                      {isToday && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      )}
                    </div>

                    <div className="min-h-[50px]">
                      {day.isRestDay ? (
                        <span className="inline-block text-xs font-semibold text-slate-500 mt-1">
                          {isUr ? "آرام کا دن" : "Rest Day"}
                        </span>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {day.routine?.name || "Workout"}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {day.scheduledTime}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleRestDay(day)}
                      className="text-[11px] text-slate-400 hover:text-emerald-400"
                    >
                      {day.isRestDay ? (isUr ? "ورزش لگائیں" : "+ Add") : (isUr ? "آرام رکھیں" : "Rest")}
                    </button>
                    {!day.isRestDay && day.routine && (
                      <button
                        onClick={() => {
                          const rout = routines.find((r) => r.id === day.routine?.id);
                          if (rout) handleStartWorkout(rout);
                        }}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        {isUr ? "شروع" : "Start"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Routines Library Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isUr ? "ورزش کے معمولات لائبریری" : "Routine Library"}
              </h2>
              <p className="text-xs text-slate-400">
                {isUr
                  ? "ماہرین کے تیار کردہ ٹیمپلیٹس یا اپنے حسب ضرورت پلانز استعمال کریں"
                  : "Verified training splits and personalized custom routines."}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => setSelectedTab("all")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  selectedTab === "all"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isUr ? "تمام" : "All"} ({routines.length})
              </button>
              <button
                onClick={() => setSelectedTab("my")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  selectedTab === "my"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isUr ? "میرے معمولات" : "My Routines"} (
                {routines.filter((r) => !r.isTemplate).length})
              </button>
              <button
                onClick={() => setSelectedTab("templates")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  selectedTab === "templates"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {isUr ? "ٹیمپلیٹس" : "Templates"} (
                {routines.filter((r) => r.isTemplate).length})
              </button>
            </div>
          </div>

          {/* Routine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoutines.map((routine) => (
              <Card
                key={routine.id}
                className="border-slate-800 bg-slate-900/70 hover:border-slate-700 flex flex-col justify-between transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="border-slate-700 bg-slate-800 text-[10px] uppercase font-semibold text-slate-300"
                        >
                          {routine.splitType.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize ${
                            routine.difficulty === "beginner"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                              : routine.difficulty === "intermediate"
                              ? "bg-blue-950 text-blue-400 border border-blue-500/30"
                              : "bg-purple-950 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {routine.difficulty}
                        </Badge>
                        {routine.isTemplate && (
                          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px]">
                            {isUr ? "تصدیق شدہ" : "Verified"}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                        {isUr && routine.nameUr ? routine.nameUr : routine.name}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDuplicateRoutine(routine.id)}
                        disabled={actionLoading === `dup-${routine.id}`}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        title={isUr ? "نقل کریں" : "Duplicate routine"}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {!routine.isTemplate && (
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                          title={isUr ? "ترمیم کریں" : "Edit routine"}
                        >
                          <Link href={`/workouts/builder/${routine.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {isUr && routine.descriptionUr
                      ? routine.descriptionUr
                      : routine.description || "Custom structured training routine."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Metadata Chips */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 border-y border-slate-800/80 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{routine.targetDurationMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{routine.exerciseCount} exercises</span>
                    </div>
                  </div>

                  {/* Exercises Preview List */}
                  <div className="space-y-1.5">
                    {routine.exercises.slice(0, 3).map((exItem, idx) => (
                      <div
                        key={exItem.id || idx}
                        className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/50 rounded-md px-2.5 py-1.5"
                      >
                        <span className="truncate max-w-[170px]">
                          {isUr && exItem.exercise.nameUr
                            ? exItem.exercise.nameUr
                            : exItem.exercise.nameEn}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {exItem.targetSets} × {exItem.targetRepsMin}-{exItem.targetRepsMax}
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <p className="text-[11px] text-slate-500 text-center pt-0.5">
                        +{routine.exercises.length - 3} more exercises
                      </p>
                    )}
                  </div>

                  {/* Start Routine Button */}
                  <Button
                    onClick={() => handleStartWorkout(routine)}
                    disabled={actionLoading === routine.id}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 shadow-md shadow-emerald-950"
                  >
                    {actionLoading === routine.id ? (
                      <RotateCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                    )}
                    {isUr ? "ورزش شروع کریں" : "Start Workout"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRoutines.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <Dumbbell className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">
                {isUr ? "کوئی معمولات نہیں ملے" : "No Routines Found"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {isUr
                  ? "اپنا نیا معمول بنانے کے لیے بٹن دبائیں۔"
                  : "Create your first custom training routine to get started."}
              </p>
              <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-xs">
                <Link href="/workouts/builder">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {isUr ? "نیا معمول بنائیں" : "Create Routine"}
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
