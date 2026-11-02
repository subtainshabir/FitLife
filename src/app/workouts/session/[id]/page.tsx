"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell,
  Clock,
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Award,
  AlertCircle,
  Play,
  Pause,
  Shuffle,
  EyeOff,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestTimer } from "@/components/workouts/rest-timer";
import { useI18n } from "@/lib/i18n/context";

interface SessionExerciseItem {
  id: string; // sessionExerciseId
  exerciseId: string;
  orderIndex: number;
  isSkipped: boolean;
  notes?: string | null;
  exercise: {
    id: string;
    nameEn: string;
    nameUr: string;
    primaryMuscle: string;
    trainingType: string;
    equipment: string;
    isBodyweight: boolean;
  };
  targetConfig: {
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    targetWeightKg: number;
    targetDurationSeconds?: number | null;
    restSeconds: number;
  };
  sets: Array<{
    id?: string;
    setNumber: number;
    isWarmup: boolean;
    weightKg: number;
    repsCompleted: number;
    durationSeconds?: number | null;
    isCompleted: boolean;
    rpe?: number | null;
  }>;
}

export default function ActiveWorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  const { language } = useI18n();
  const isUr = language === "ur";

  const [sessionData, setSessionData] = useState<any | null>(null);
  const [exercisesList, setExercisesList] = useState<SessionExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Rest Timer Modal
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [restExerciseName, setRestExerciseName] = useState("");

  // PR Celebratory Alert
  const [newPrAlert, setNewPrAlert] = useState<{
    metricLabel: string;
    exerciseName: string;
  } | null>(null);

  // Substitute modal
  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [substitutingExerciseId, setSubstitutingExerciseId] = useState<string | null>(null);
  const [availableReplacements, setAvailableReplacements] = useState<any[]>([]);

  // Finish Workout Modal
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [overallRpe, setOverallRpe] = useState<number>(8);
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [completing, setCompleting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<any | null>(null);

  // 1. Fetch Session Data & Initial Recovery Check
  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/workouts/sessions/${sessionId}`);
        if (res.ok) {
          const json = await res.json();
          const sess = json.data;
          setSessionData(sess);
          setExercisesList(sess.exercises || []);

          // Calculate elapsed seconds from startTime
          if (sess.startTime) {
            const startMs = new Date(sess.startTime).getTime();
            const nowMs = Date.now();
            const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
            setElapsedSeconds(elapsed);
          }

          // Check if session is already completed
          if (sess.status === "completed") {
            setIsTimerRunning(false);
          }
        } else {
          router.push("/workouts");
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      loadSession();
    }
  }, [sessionId, router]);

  // 2. Active Session Elapsed Ticker
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // 3. Save Active State to LocalStorage for offline recovery
  useEffect(() => {
    if (!sessionId || exercisesList.length === 0) return;
    try {
      localStorage.setItem(
        `fitlife_active_session_${sessionId}`,
        JSON.stringify({
          sessionId,
          elapsedSeconds,
          exercisesList,
          timestamp: Date.now(),
        })
      );
    } catch {
      // LocalStorage quota fallback
    }
  }, [sessionId, elapsedSeconds, exercisesList]);

  // 4. Update Set field & save to backend
  const handleUpdateSet = async (
    exIdx: number,
    setIdx: number,
    field: string,
    value: any
  ) => {
    const updatedExList = [...exercisesList];
    const currentSet = { ...updatedExList[exIdx].sets[setIdx], [field]: value };
    updatedExList[exIdx].sets[setIdx] = currentSet;
    setExercisesList(updatedExList);

    // Save to API
    try {
      await fetch(`/api/v1/workouts/sessions/${sessionId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionExerciseId: updatedExList[exIdx].id,
          setNumber: currentSet.setNumber,
          isWarmup: currentSet.isWarmup,
          weightKg: currentSet.weightKg,
          repsCompleted: currentSet.repsCompleted,
          durationSeconds: currentSet.durationSeconds || null,
          isCompleted: currentSet.isCompleted,
          rpe: currentSet.rpe || null,
        }),
      });
    } catch (e) {
      console.warn("Set update deferred to offline recovery:", e);
    }
  };

  // 5. Toggle Set Completion (Triggers Rest Timer & PR Check)
  const handleToggleCompleteSet = async (exIdx: number, setIdx: number) => {
    const updatedExList = [...exercisesList];
    const targetSet = updatedExList[exIdx].sets[setIdx];
    const targetEx = updatedExList[exIdx];
    const newCompleted = !targetSet.isCompleted;

    targetSet.isCompleted = newCompleted;
    setExercisesList(updatedExList);

    try {
      const res = await fetch(`/api/v1/workouts/sessions/${sessionId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionExerciseId: targetEx.id,
          setNumber: targetSet.setNumber,
          isWarmup: targetSet.isWarmup,
          weightKg: targetSet.weightKg,
          repsCompleted: targetSet.repsCompleted,
          durationSeconds: targetSet.durationSeconds || null,
          isCompleted: newCompleted,
          rpe: targetSet.rpe || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();

        // Update session stats
        if (json.data?.sessionStats) {
          setSessionData((prev: any) => ({
            ...prev,
            totalVolumeKg: json.data.sessionStats.totalVolumeKg,
            totalSetsCompleted: json.data.sessionStats.totalSetsCompleted,
            totalRepsCompleted: json.data.sessionStats.totalRepsCompleted,
          }));
        }

        // Check if any new records were achieved
        if (json.data?.newRecords && json.data.newRecords.length > 0) {
          const topRecord = json.data.newRecords[0];
          setNewPrAlert({
            metricLabel: topRecord.metricLabel,
            exerciseName: targetEx.exercise.nameEn,
          });
        }
      }
    } catch (err) {
      console.error("Error saving set completion:", err);
    }

    // Trigger rest timer if set was completed (and not unmarked)
    if (newCompleted) {
      setRestSeconds(targetEx.targetConfig.restSeconds || 60);
      setRestExerciseName(targetEx.exercise.nameEn);
      setRestTimerOpen(true);
    }
  };

  // 6. Add Set to exercise
  const handleAddSet = (exIdx: number) => {
    const updatedExList = [...exercisesList];
    const ex = updatedExList[exIdx];
    const nextSetNumber = ex.sets.length + 1;
    const lastSet = ex.sets[ex.sets.length - 1];

    ex.sets.push({
      setNumber: nextSetNumber,
      isWarmup: false,
      weightKg: lastSet ? lastSet.weightKg : ex.targetConfig.targetWeightKg || 0,
      repsCompleted: lastSet ? lastSet.repsCompleted : ex.targetConfig.targetRepsMax || 10,
      durationSeconds: null,
      isCompleted: false,
      rpe: null,
    });

    setExercisesList(updatedExList);
  };

  // 7. Remove Set
  const handleRemoveSet = async (exIdx: number, setIdx: number) => {
    const updatedExList = [...exercisesList];
    const ex = updatedExList[exIdx];
    const removedSet = ex.sets[setIdx];

    ex.sets = ex.sets
      .filter((_, idx) => idx !== setIdx)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

    setExercisesList(updatedExList);

    if (removedSet.id) {
      try {
        await fetch(`/api/v1/workouts/sessions/${sessionId}/sets/${removedSet.id}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.warn("Delete set error:", e);
      }
    }
  };

  // 8. Skip Exercise
  const handleSkipExercise = async (sessionExId: string) => {
    try {
      const res = await fetch(`/api/v1/workouts/sessions/${sessionId}/exercise-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "skip",
          sessionExerciseId: sessionExId,
        }),
      });

      if (res.ok) {
        setExercisesList((prev) =>
          prev.map((e) => (e.id === sessionExId ? { ...e, isSkipped: true } : e))
        );
      }
    } catch (e) {
      console.error("Skip exercise error:", e);
    }
  };

  // 9. Open Substitute Modal
  const handleOpenSubstitute = async (sessionExId: string) => {
    setSubstitutingExerciseId(sessionExId);
    setSubstituteModalOpen(true);
    try {
      const res = await fetch("/api/v1/exercises?limit=50");
      if (res.ok) {
        const json = await res.json();
        setAvailableReplacements(json.data?.exercises || json.data || []);
      }
    } catch (e) {
      console.error("Load alternatives error:", e);
    }
  };

  // Execute substitution
  const handleConfirmSubstitute = async (replacementEx: any) => {
    if (!substitutingExerciseId) return;

    try {
      const res = await fetch(`/api/v1/workouts/sessions/${sessionId}/exercise-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "substitute",
          sessionExerciseId: substitutingExerciseId,
          replacementExerciseId: replacementEx.id,
        }),
      });

      if (res.ok) {
        setExercisesList((prev) =>
          prev.map((e) =>
            e.id === substitutingExerciseId
              ? {
                  ...e,
                  exerciseId: replacementEx.id,
                  exercise: replacementEx,
                }
              : e
          )
        );
        setSubstituteModalOpen(false);
      }
    } catch (e) {
      console.error("Substitution error:", e);
    }
  };

  // 10. Complete Workout Session
  const handleCompleteSession = async () => {
    try {
      setCompleting(true);
      const res = await fetch(`/api/v1/workouts/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationSeconds: elapsedSeconds,
          rating,
          perceivedExertionRpe: overallRpe,
          notes: sessionNotes || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setIsTimerRunning(false);
        setCompletedSummary(json.data);
      } else {
        alert("Failed to complete workout session.");
      }
    } catch (err) {
      console.error("Complete session error:", err);
    } finally {
      setCompleting(false);
    }
  };

  // Format Elapsed Time HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Compute live progress stats
  const totalSetsCount = exercisesList
    .filter((e) => !e.isSkipped)
    .reduce((sum, e) => sum + e.sets.length, 0);

  const completedSetsCount = exercisesList
    .filter((e) => !e.isSkipped)
    .reduce((sum, e) => sum + e.sets.filter((s) => s.isCompleted).length, 0);

  const liveVolumeKg = exercisesList
    .filter((e) => !e.isSkipped)
    .reduce(
      (sum, e) =>
        sum +
        e.sets
          .filter((s) => s.isCompleted)
          .reduce(
            (sSum, s) =>
              sSum + (s.weightKg > 0 ? s.weightKg * s.repsCompleted : (e.exercise.isBodyweight ? 42 : 1) * s.repsCompleted),
            0
          ),
      0
    );

  if (loading || !sessionData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Dumbbell className="h-8 w-8 animate-pulse text-emerald-500 mb-2" />
        <p className="text-sm">Loading active workout tracker...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Fixed Header with Live Timer and Metrics */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-white">
              <Link href="/workouts">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                {sessionData.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center font-mono text-emerald-400 font-semibold">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {formatTime(elapsedSeconds)}
                </span>
                <span>•</span>
                <span>
                  {completedSetsCount} / {totalSetsCount} {isUr ? "سیٹس" : "Sets"}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300 font-semibold">
                  {Math.round(liveVolumeKg)} kg
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setFinishModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 h-9 shadow-md shadow-emerald-950"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {isUr ? "مکمل کریں" : "Finish"}
          </Button>
        </div>
      </header>

      {/* Main Exercise Stack */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Personal Record Toast Notification */}
        {newPrAlert && (
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 p-4 shadow-xl flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {isUr ? "نیا ریکارڈ قائم ہوا!" : "New Personal Record Achieved!"}
                </span>
                <p className="text-sm font-semibold text-white">
                  {newPrAlert.exerciseName}: <strong className="text-amber-300">{newPrAlert.metricLabel}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewPrAlert(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Exercises */}
        {exercisesList.map((item, exIdx) => (
          <Card
            key={item.id || exIdx}
            className={`border ${
              item.isSkipped
                ? "border-slate-800/40 bg-slate-900/20 opacity-60"
                : "border-slate-800 bg-slate-900/70"
            }`}
          >
            <CardHeader className="pb-3 border-b border-slate-800/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 font-mono text-[10px] font-bold text-slate-300">
                      {exIdx + 1}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-slate-700 bg-slate-800 text-[10px] uppercase font-semibold text-emerald-400"
                    >
                      {item.exercise.primaryMuscle?.replace("_", " ")}
                    </Badge>
                    {item.isSkipped && (
                      <Badge variant="destructive" className="text-[10px]">
                        Skipped
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base font-bold text-white">
                    {isUr && item.exercise.nameUr ? item.exercise.nameUr : item.exercise.nameEn}
                  </CardTitle>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: {item.targetConfig.targetSets} sets • {item.targetConfig.targetRepsMin}-
                    {item.targetConfig.targetRepsMax} reps
                    {item.targetConfig.targetWeightKg > 0 && ` @ ${item.targetConfig.targetWeightKg} kg`}
                  </p>
                </div>

                {/* Exercise Actions */}
                {!item.isSkipped && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenSubstitute(item.id)}
                      className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                      title="Substitute Exercise"
                    >
                      <Shuffle className="h-3.5 w-3.5 mr-1" />
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSkipExercise(item.id)}
                      className="h-8 px-2 text-xs text-slate-400 hover:text-amber-400"
                      title="Skip Exercise"
                    >
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                      Skip
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            {!item.isSkipped && (
              <CardContent className="pt-4 space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  <div className="col-span-2 sm:col-span-1 text-center">Set</div>
                  <div className="col-span-4 sm:col-span-3 text-center">Weight (kg)</div>
                  <div className="col-span-3 sm:col-span-3 text-center">Reps</div>
                  <div className="hidden sm:block sm:col-span-2 text-center">RPE</div>
                  <div className="col-span-3 sm:col-span-3 text-center">Log</div>
                </div>

                {/* Sets Rows */}
                <div className="space-y-2">
                  {item.sets.map((set, setIdx) => (
                    <div
                      key={set.setNumber}
                      className={`grid grid-cols-12 gap-2 items-center rounded-xl p-2 transition ${
                        set.isCompleted
                          ? "bg-emerald-950/20 border border-emerald-500/30"
                          : "bg-slate-950/60 border border-slate-800/80"
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-2 sm:col-span-1 text-center font-mono text-xs font-bold text-slate-300">
                        {set.setNumber}
                      </div>

                      {/* Weight Stepper */}
                      <div className="col-span-4 sm:col-span-3 flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          step="0.5"
                          min={0}
                          value={set.weightKg}
                          onChange={(e) =>
                            handleUpdateSet(
                              exIdx,
                              setIdx,
                              "weightKg",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-10 text-center font-bold text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>

                      {/* Reps Stepper */}
                      <div className="col-span-3 sm:col-span-3 flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={set.repsCompleted}
                          onChange={(e) =>
                            handleUpdateSet(
                              exIdx,
                              setIdx,
                              "repsCompleted",
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="h-10 text-center font-bold text-sm bg-slate-900 border-slate-700 text-white"
                        />
                      </div>

                      {/* Optional RPE (hidden on very small phones) */}
                      <div className="hidden sm:block sm:col-span-2">
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step="0.5"
                          placeholder="RPE"
                          value={set.rpe || ""}
                          onChange={(e) =>
                            handleUpdateSet(
                              exIdx,
                              setIdx,
                              "rpe",
                              parseFloat(e.target.value) || null
                            )
                          }
                          className="h-10 text-center text-xs bg-slate-900 border-slate-700 text-slate-300"
                        />
                      </div>

                      {/* Complete Checkbox Button (Large Touch Target) */}
                      <div className="col-span-3 sm:col-span-3 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleteSet(exIdx, setIdx)}
                          className={`h-10 w-full rounded-xl flex items-center justify-center font-bold text-xs transition active:scale-95 ${
                            set.isCompleted
                              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          <Check className="h-5 w-5 stroke-[3]" />
                        </button>

                        {item.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="p-1.5 text-slate-600 hover:text-red-400"
                            title="Remove Set"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Set Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSet(exIdx)}
                  className="w-full mt-2 h-9 border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-300 hover:border-slate-700"
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  + Add Set
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </main>

      {/* Floating Rest Timer Component */}
      <RestTimer
        isOpen={restTimerOpen}
        initialSeconds={restSeconds}
        exerciseName={restExerciseName}
        onClose={() => setRestTimerOpen(false)}
        onComplete={() => setRestTimerOpen(false)}
      />

      {/* Finish Workout Summary Modal */}
      {finishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            {!completedSummary ? (
              <>
                <div className="text-center space-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto mb-2">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {isUr ? "ورزش مکمل کریں؟" : "Complete Workout Session?"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isUr
                      ? "اپنی کوشش کی درجہ بندی کریں اور کارکردگی محفوظ کریں۔"
                      : "Rate your session exertion and finalize your performance metrics."}
                  </p>
                </div>

                {/* Rating & Exertion */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 text-center">
                      {isUr ? "ورزش کا اطمینان (1 سے 5 ستارے)" : "Session Satisfaction (1 to 5)"}
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className={`p-2 rounded-xl transition ${
                            rating >= s ? "text-amber-400 bg-amber-500/10" : "text-slate-600 bg-slate-800"
                          }`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{isUr ? "مشقت کی شدت (RPE)" : "Rate of Perceived Exertion (RPE)"}</span>
                      <span className="font-bold text-emerald-400">{overallRpe} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={overallRpe}
                      onChange={(e) => setOverallRpe(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Light</span>
                      <span>Challenging</span>
                      <span>Maximum Effort</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {isUr ? "نوٹس (اختیاری)" : "Session Notes (Optional)"}
                    </label>
                    <Input
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="e.g. Felt explosive on bench, slight lower back fatigue on squats"
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <Button
                    variant="outline"
                    onClick={() => setFinishModalOpen(false)}
                    className="flex-1 border-slate-700 bg-slate-800 text-xs text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteSession}
                    disabled={completing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    {completing ? "Finalizing..." : isUr ? "محفوظ کریں اور مکمل کریں" : "Save & Finish"}
                  </Button>
                </div>
              </>
            ) : (
              /* Celebration & Achievement Summary Screen */
              <div className="text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto">
                  <Award className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isUr ? "بہترین کام! ورزش مکمل ہوئی!" : "Outstanding Effort! Workout Complete!"}
                </h3>

                {/* Metrics Badges */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Volume</span>
                    <p className="font-mono text-base font-extrabold text-emerald-400">
                      {completedSummary.session.totalVolumeKg} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Duration</span>
                    <p className="font-mono text-base font-extrabold text-white">
                      {completedSummary.summary.durationFormatted}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Calories</span>
                    <p className="font-mono text-base font-extrabold text-amber-400">
                      {completedSummary.summary.caloriesBurned} kcal
                    </p>
                  </div>
                </div>

                {/* Broken PRs List */}
                {completedSummary.newRecords && completedSummary.newRecords.length > 0 && (
                  <div className="space-y-2 text-left bg-amber-950/20 border border-amber-500/30 rounded-xl p-3">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      {completedSummary.newRecords.length} New Personal Records Broken!
                    </span>
                    {completedSummary.newRecords.map((rec: any, idx: number) => (
                      <p key={idx} className="text-xs text-slate-200">
                        • {rec.metricLabel} ({rec.recordType.replace("_", " ")})
                      </p>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => router.push("/workouts")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-11"
                >
                  {isUr ? "واپس معمولات جائیں" : "Return to Workout Hub"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Substitute Exercise Modal */}
      {substituteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[80vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {isUr ? "متبادل ورزش منتخب کریں" : "Select Replacement Exercise"}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSubstituteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {availableReplacements.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {isUr && ex.nameUr ? ex.nameUr : ex.nameEn}
                    </h4>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {ex.primaryMuscle?.replace("_", " ")} • {ex.trainingType}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConfirmSubstitute(ex)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

