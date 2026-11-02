"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Check,
  Save,
  RotateCw,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";

export interface RoutineExerciseFormItem {
  exerciseId: string;
  exerciseNameEn: string;
  exerciseNameUr: string;
  primaryMuscle: string;
  trainingType: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeightKg: number;
  targetDurationSeconds?: number | null;
  restSeconds: number;
  notes?: string | null;
}

interface RoutineBuilderFormProps {
  initialRoutine?: {
    id?: string;
    name: string;
    nameUr?: string | null;
    description?: string | null;
    descriptionUr?: string | null;
    difficulty: "beginner" | "intermediate" | "advanced";
    targetDurationMinutes: number;
    splitType: "full_body" | "upper_lower" | "push_pull_legs" | "body_part" | "cardio_core" | "custom";
    exercises: RoutineExerciseFormItem[];
  };
  isEditing?: boolean;
}

export function RoutineBuilderForm({ initialRoutine, isEditing = false }: RoutineBuilderFormProps) {
  const router = useRouter();
  const { language } = useI18n();
  const isUr = language === "ur";

  const [name, setName] = useState(initialRoutine?.name || "");
  const [nameUr, setNameUr] = useState(initialRoutine?.nameUr || "");
  const [description, setDescription] = useState(initialRoutine?.description || "");
  const [descriptionUr, setDescriptionUr] = useState(initialRoutine?.descriptionUr || "");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    initialRoutine?.difficulty || "beginner"
  );
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(
    initialRoutine?.targetDurationMinutes || 45
  );
  const [splitType, setSplitType] = useState<
    "full_body" | "upper_lower" | "push_pull_legs" | "body_part" | "cardio_core" | "custom"
  >(initialRoutine?.splitType || "full_body");

  const [exercisesList, setExercisesList] = useState<RoutineExerciseFormItem[]>(
    initialRoutine?.exercises || []
  );

  // Exercise Picker Modal state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogExercises, setCatalogExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load available exercises for picker
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const res = await fetch("/api/v1/exercises?limit=100");
        if (res.ok) {
          const json = await res.json();
          setCatalogExercises(json.data?.exercises || json.data || []);
        }
      } catch (err) {
        console.error("Error loading exercises catalog:", err);
      } finally {
        setLoadingCatalog(false);
      }
    }

    loadCatalog();
  }, []);

  const addExerciseToRoutine = (ex: any) => {
    const newItem: RoutineExerciseFormItem = {
      exerciseId: ex.id,
      exerciseNameEn: ex.nameEn,
      exerciseNameUr: ex.nameUr,
      primaryMuscle: ex.primaryMuscle,
      trainingType: ex.trainingType,
      orderIndex: exercisesList.length,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: ex.isBodyweight ? 0 : 20,
      targetDurationSeconds: null,
      restSeconds: 60,
      notes: null,
    };
    setExercisesList([...exercisesList, newItem]);
    setPickerOpen(false);
  };

  const removeExercise = (index: number) => {
    const updated = exercisesList
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, orderIndex: idx }));
    setExercisesList(updated);
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === exercisesList.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...exercisesList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    setExercisesList(updated.map((item, idx) => ({ ...item, orderIndex: idx })));
  };

  const updateExerciseField = (
    index: number,
    field: keyof RoutineExerciseFormItem,
    value: any
  ) => {
    const updated = [...exercisesList];
    updated[index] = { ...updated[index], [field]: value };
    setExercisesList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(isUr ? "براہ کرم معمول کا نام درج کریں۔" : "Please provide a routine name.");
      return;
    }
    if (exercisesList.length === 0) {
      alert(
        isUr
          ? "براہ کرم معمول میں کم از کم ایک ورزش شامل کریں۔"
          : "Please add at least one exercise to the routine."
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        nameUr: nameUr || null,
        description: description || null,
        descriptionUr: descriptionUr || null,
        difficulty,
        targetDurationMinutes,
        splitType,
        exercises: exercisesList.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          orderIndex: idx,
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          targetWeightKg: ex.targetWeightKg,
          targetDurationSeconds: ex.targetDurationSeconds || null,
          restSeconds: ex.restSeconds,
          notes: ex.notes || null,
        })),
      };

      const url = isEditing
        ? `/api/v1/workouts/routines/${initialRoutine?.id}`
        : "/api/v1/workouts/routines";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/workouts");
      } else {
        const errorJson = await res.json();
        alert(`Failed to save routine: ${errorJson.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save routine error:", err);
      alert("Failed to save routine.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter exercises for picker modal
  const filteredCatalog = catalogExercises.filter((ex) => {
    const matchesSearch =
      ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.nameUr?.includes(searchQuery);
    const matchesMuscle =
      selectedMuscle === "all" || ex.primaryMuscle?.toLowerCase() === selectedMuscle.toLowerCase();
    return matchesSearch && matchesMuscle;
  });

  const totalSets = exercisesList.reduce((sum, item) => sum + item.targetSets, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
          <Link href="/workouts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isUr ? "واپس معمولات" : "Back to Hub"}
          </Link>
        </Button>

        <h1 className="text-xl font-bold text-white">
          {isEditing
            ? isUr
              ? "معمول میں ترمیم کریں"
              : "Edit Workout Routine"
            : isUr
            ? "نیا معمول تیار کریں"
            : "Create Workout Routine"}
        </h1>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950"
        >
          {submitting ? (
            <RotateCw className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {isUr ? "محفوظ کریں" : "Save Routine"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isUr ? "معمول کا نام (انگریزی)" : "Routine Name (English) *"}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Upper Body Hypertrophy"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isUr ? "معمول کا نام (اردو - اختیاری)" : "Routine Name (Urdu - Optional)"}
              </label>
              <Input
                value={nameUr}
                onChange={(e) => setNameUr(e.target.value)}
                placeholder="مثلاً اوپری جسم کی ورزش"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-right"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {isUr ? "تفصیل" : "Description (Optional)"}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Focus on chest, shoulders, and triceps with progressive loading"
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isUr ? "مشکل کی سطح" : "Difficulty Level"}
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="beginner">Beginner (ابتدائی)</option>
                <option value="intermediate">Intermediate (درمیانی)</option>
                <option value="advanced">Advanced (ماہر)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isUr ? "تربیت کی قسم" : "Split Type"}
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as any)}
                className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="full_body">Full Body</option>
                <option value="upper_lower">Upper / Lower</option>
                <option value="push_pull_legs">Push / Pull / Legs (PPL)</option>
                <option value="body_part">Body Part / Isolation</option>
                <option value="cardio_core">Cardio & Core</option>
                <option value="custom">Custom Split</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isUr ? "تخمینہ وقت (منٹ)" : "Target Duration (Minutes)"}
              </label>
              <Input
                type="number"
                min={10}
                max={180}
                value={targetDurationMinutes}
                onChange={(e) => setTargetDurationMinutes(parseInt(e.target.value, 10) || 45)}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>
        </Card>

        {/* Exercises Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                {isUr ? "معمول کی ورزشیں" : "Routine Exercises"} ({exercisesList.length})
              </h2>
              <p className="text-xs text-slate-400">
                {isUr
                  ? `کل سیٹس: ${totalSets} • تخمینہ وقت: ${targetDurationMinutes} منٹ`
                  : `Total sets: ${totalSets} • Target rest & progression settings`}
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {isUr ? "ورزش شامل کریں" : "Add Exercise"}
            </Button>
          </div>

          {/* Exercise Items List */}
          {exercisesList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center bg-slate-900/30">
              <Dumbbell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">
                {isUr ? "کوئی ورزش شامل نہیں کی گئی" : "No exercises added yet"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isUr
                  ? "لائبریری سے ورزشیں منتخب کرنے کے لیے اوپر بٹن دبائیں۔"
                  : "Click 'Add Exercise' to select movements from the library."}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(true)}
                className="mt-3 border-slate-700 bg-slate-800 text-xs text-slate-200"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                Browse Library
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {exercisesList.map((item, index) => (
                <div
                  key={`${item.exerciseId}-${index}`}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        <button
                          type="button"
                          onClick={() => moveExercise(index, "up")}
                          disabled={index === 0}
                          className="p-1 hover:text-white disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(index, "down")}
                          disabled={index === exercisesList.length - 1}
                          className="p-1 hover:text-white disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 font-mono text-xs font-bold text-slate-300">
                        {index + 1}
                      </span>

                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {isUr && item.exerciseNameUr ? item.exerciseNameUr : item.exerciseNameEn}
                        </h4>
                        <span className="text-[11px] text-emerald-400 capitalize">
                          {item.primaryMuscle.replace("_", " ")} • {item.trainingType}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeExercise(index)}
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Target Values Configuration */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {isUr ? "سیٹس" : "Target Sets"}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={item.targetSets}
                        onChange={(e) =>
                          updateExerciseField(index, "targetSets", parseInt(e.target.value, 10) || 1)
                        }
                        className="h-8 bg-slate-950 border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {isUr ? "ریپس کی رینج" : "Reps Range"}
                      </label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={item.targetRepsMin}
                          onChange={(e) =>
                            updateExerciseField(
                              index,
                              "targetRepsMin",
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="h-8 bg-slate-950 border-slate-800 text-xs text-white text-center"
                        />
                        <span className="text-slate-600">-</span>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={item.targetRepsMax}
                          onChange={(e) =>
                            updateExerciseField(
                              index,
                              "targetRepsMax",
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="h-8 bg-slate-950 border-slate-800 text-xs text-white text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {isUr ? "ہدف وزن (کلو)" : "Target Weight (kg)"}
                      </label>
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        max={500}
                        value={item.targetWeightKg}
                        onChange={(e) =>
                          updateExerciseField(
                            index,
                            "targetWeightKg",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 bg-slate-950 border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {isUr ? "آرام (سیکنڈ)" : "Rest Period (s)"}
                      </label>
                      <select
                        value={item.restSeconds}
                        onChange={(e) =>
                          updateExerciseField(index, "restSeconds", parseInt(e.target.value, 10))
                        }
                        className="w-full h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-white focus:outline-none"
                      >
                        <option value={30}>30s</option>
                        <option value={45}>45s</option>
                        <option value={60}>60s (1m)</option>
                        <option value={90}>90s (1.5m)</option>
                        <option value={120}>120s (2m)</option>
                        <option value={180}>180s (3m)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Exercise Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {isUr ? "ورزش منتخب کریں" : "Select Exercise from Library"}
                </h3>
                <p className="text-xs text-slate-400">
                  {catalogExercises.length} movements available
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by exercise name..."
                  className="pl-9 h-9 bg-slate-900 border-slate-800 text-xs text-white"
                />
              </div>

              {/* Muscle Filters */}
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {[
                  "all",
                  "chest",
                  "back",
                  "shoulders",
                  "biceps",
                  "triceps",
                  "quadriceps",
                  "hamstrings",
                  "glutes",
                  "abdominals",
                ].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMuscle(m)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                      selectedMuscle === m
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredCatalog.map((ex) => {
                const isAlreadyAdded = exercisesList.some((item) => item.exerciseId === ex.id);
                return (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {isUr && ex.nameUr ? ex.nameUr : ex.nameEn}
                      </h4>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {ex.primaryMuscle?.replace("_", " ")} • {ex.trainingType} • {ex.equipment}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addExerciseToRoutine(ex)}
                      disabled={isAlreadyAdded}
                      className={
                        isAlreadyAdded
                          ? "bg-slate-800 text-slate-500 text-xs"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                      }
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Added
                        </>
                      ) : (
                        "+ Add"
                      )}
                    </Button>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8">
                  No matching exercises found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

