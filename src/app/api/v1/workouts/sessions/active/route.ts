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
import { eq, and, asc, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch most recent in_progress session
    const [activeSession] = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, "in_progress")
        )
      )
      .orderBy(desc(workoutSessions.startTime))
      .limit(1);

    if (!activeSession) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Fetch session exercises
    const sessionExList = await db
      .select({
        sessionExercise: sessionExercises,
        exercise: exercises,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, activeSession.id))
      .orderBy(asc(sessionExercises.orderIndex));

    // Fetch sets for each session exercise
    const sessionExIds = sessionExList.map((se) => se.sessionExercise.id);
    let allSets: (typeof sessionSets.$inferSelect)[] = [];

    if (sessionExIds.length > 0) {
      allSets = await db
        .select()
        .from(sessionSets)
        .orderBy(asc(sessionSets.setNumber));
    }

    // If routineId exists, fetch targets from routine_exercises
    let routineTargets: (typeof routineExercises.$inferSelect)[] = [];
    if (activeSession.routineId) {
      routineTargets = await db
        .select()
        .from(routineExercises)
        .where(eq(routineExercises.routineId, activeSession.routineId));
    }

    const structuredExercises = sessionExList.map((row) => {
      const exSets = allSets
        .filter((s) => s.sessionExerciseId === row.sessionExercise.id)
        .sort((a, b) => a.setNumber - b.setNumber);

      const target = routineTargets.find(
        (t) => t.exerciseId === row.sessionExercise.exerciseId
      );

      return {
        ...row.sessionExercise,
        exercise: row.exercise,
        targetConfig: target
          ? {
              targetSets: target.targetSets,
              targetRepsMin: target.targetRepsMin,
              targetRepsMax: target.targetRepsMax,
              targetWeightKg: target.targetWeightKg,
              targetDurationSeconds: target.targetDurationSeconds,
              restSeconds: target.restSeconds,
            }
          : {
              targetSets: exSets.length || 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              targetWeightKg: 0,
              targetDurationSeconds: null,
              restSeconds: 60,
            },
        sets: exSets,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...activeSession,
        exercises: structuredExercises,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/sessions/active error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve active session", details: error.message },
      { status: 500 }
    );
  }
}
