"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoutineBuilderForm, RoutineExerciseFormItem } from "@/components/workouts/routine-builder-form";
import { RotateCw } from "lucide-react";

export default function EditRoutinePage() {
  const params = useParams();
  const router = useRouter();
  const routineId = params?.id as string;

  const [routineData, setRoutineData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoutine() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/workouts/routines/${routineId}`);
        if (res.ok) {
          const json = await res.json();
          const r = json.data;

          const formattedExercises: RoutineExerciseFormItem[] = (r.exercises || []).map(
            (item: any, idx: number) => ({
              exerciseId: item.exerciseId || item.exercise?.id,
              exerciseNameEn: item.exercise?.nameEn || "Exercise",
              exerciseNameUr: item.exercise?.nameUr || "",
              primaryMuscle: item.exercise?.primaryMuscle || "core",
              trainingType: item.exercise?.trainingType || "strength",
              orderIndex: item.orderIndex ?? idx,
              targetSets: item.targetSets || 3,
              targetRepsMin: item.targetRepsMin || 8,
              targetRepsMax: item.targetRepsMax || 12,
              targetWeightKg: item.targetWeightKg || 0,
              targetDurationSeconds: item.targetDurationSeconds || null,
              restSeconds: item.restSeconds || 60,
              notes: item.notes || null,
            })
          );

          setRoutineData({
            id: r.id,
            name: r.name,
            nameUr: r.nameUr,
            description: r.description,
            descriptionUr: r.descriptionUr,
            difficulty: r.difficulty,
            targetDurationMinutes: r.targetDurationMinutes,
            splitType: r.splitType,
            exercises: formattedExercises,
          });
        } else {
          router.push("/workouts");
        }
      } catch (err) {
        console.error("Failed to load routine for editing:", err);
      } finally {
        setLoading(false);
      }
    }

    if (routineId) {
      loadRoutine();
    }
  }, [routineId, router]);

  if (loading || !routineData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="h-6 w-6 animate-spin mr-2 text-emerald-500" />
        <span>Loading routine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <RoutineBuilderForm initialRoutine={routineData} isEditing={true} />
    </div>
  );
}

