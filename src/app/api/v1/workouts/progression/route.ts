import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  workoutSessions,
  sessionExercises,
  sessionSets,
  exercises,
  routineExercises,
} from "@/db/schema";
import { evaluateProgressiveOverload } from "@/lib/services/workout-service";
import { eq, and, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const exerciseId = searchParams.get("exerciseId");

    if (!exerciseId) {
      return NextResponse.json({ error: "exerciseId query parameter is required" }, { status: 400 });
    }

    // Verify exercise exists
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, exerciseId))
      .limit(1);

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Retrieve sessions where this exercise was performed by user
    const loggedSessionExs = await db
      .select({
        sessionId: sessionExercises.sessionId,
        sessionExerciseId: sessionExercises.id,
        sessionName: workoutSessions.name,
        sessionDate: workoutSessions.startTime,
        isSkipped: sessionExercises.isSkipped,
      })
      .from(sessionExercises)
      .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(sessionExercises.exerciseId, exerciseId),
          eq(workoutSessions.status, "completed"),
          eq(sessionExercises.isSkipped, false)
        )
      )
      .orderBy(desc(workoutSessions.startTime))
      .limit(10);

    const historyPoints: Array<{
      date: string;
      sessionName: string;
      topWeightKg: number;
      totalVolumeKg: number;
      sets: Array<{
        setNumber: number;
        weightKg: number;
        repsCompleted: number;
        rpe?: number | null;
        isCompleted: boolean;
      }>;
    }> = [];

    let mostRecentSets: Array<{
      weightKg: number;
      repsCompleted: number;
      isCompleted: boolean;
      isWarmup?: boolean;
      rpe?: number | null;
    }> = [];

    for (let idx = 0; idx < loggedSessionExs.length; idx++) {
      const item = loggedSessionExs[idx];
      const sets = await db
        .select()
        .from(sessionSets)
        .where(eq(sessionSets.sessionExerciseId, item.sessionExerciseId))
        .orderBy(asc(sessionSets.setNumber));

      const workingSets = sets.filter((s) => s.isCompleted);
      const topWeight = workingSets.length > 0 ? Math.max(...workingSets.map((s) => s.weightKg)) : 0;
      const vol = workingSets.reduce(
        (acc, s) =>
          acc +
          (s.weightKg > 0 ? s.weightKg * s.repsCompleted : (exercise.isBodyweight ? 45 : 1) * s.repsCompleted),
        0
      );

      historyPoints.push({
        date: new Date(item.sessionDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sessionName: item.sessionName,
        topWeightKg: topWeight,
        totalVolumeKg: Math.round(vol),
        sets: sets.map((s) => ({
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          repsCompleted: s.repsCompleted,
          rpe: s.rpe,
          isCompleted: s.isCompleted,
        })),
      });

      if (idx === 0) {
        mostRecentSets = sets.map((s) => ({
          weightKg: s.weightKg,
          repsCompleted: s.repsCompleted,
          isCompleted: s.isCompleted,
          isWarmup: s.isWarmup,
          rpe: s.rpe,
        }));
      }
    }

    // Progressive overload recommendation
    const recommendation = evaluateProgressiveOverload({
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: historyPoints[0]?.topWeightKg || 0,
      primaryMuscle: exercise.primaryMuscle,
      isBodyweight: exercise.isBodyweight,
      loggedSets: mostRecentSets,
    });

    return NextResponse.json({
      success: true,
      data: {
        exercise: {
          id: exercise.id,
          nameEn: exercise.nameEn,
          nameUr: exercise.nameUr,
          primaryMuscle: exercise.primaryMuscle,
          trainingType: exercise.trainingType,
          isBodyweight: exercise.isBodyweight,
        },
        recommendation,
        history: historyPoints.reverse(), // chronologically ordered for charting
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/progression error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate progression", details: error.message },
      { status: 500 }
    );
  }
}
