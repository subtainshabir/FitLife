import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  workoutSessions,
  workoutRoutines,
  routineExercises,
  sessionExercises,
  sessionSets,
  exercises,
} from "@/db/schema";
import { startSessionSchema } from "@/lib/validations/workout";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = startSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { routineId, name, exerciseIds } = parsed.data;

    // 1. Create Workout Session
    const [newSession] = await db
      .insert(workoutSessions)
      .values({
        userId,
        routineId: routineId || null,
        name,
        status: "in_progress",
        startTime: new Date(),
        durationSeconds: 0,
        totalVolumeKg: 0,
        totalSetsCompleted: 0,
        totalRepsCompleted: 0,
      })
      .returning();

    // 2. Populate session exercises
    let targetExercises: Array<{
      exerciseId: string;
      orderIndex: number;
      targetSets: number;
      targetRepsMin: number;
      targetRepsMax: number;
      targetWeightKg: number;
      targetDurationSeconds?: number | null;
      restSeconds: number;
      notes?: string | null;
    }> = [];

    if (routineId) {
      const routineExs = await db
        .select()
        .from(routineExercises)
        .where(eq(routineExercises.routineId, routineId))
        .orderBy(asc(routineExercises.orderIndex));

      targetExercises = routineExs.map((re) => ({
        exerciseId: re.exerciseId,
        orderIndex: re.orderIndex,
        targetSets: re.targetSets,
        targetRepsMin: re.targetRepsMin,
        targetRepsMax: re.targetRepsMax,
        targetWeightKg: re.targetWeightKg,
        targetDurationSeconds: re.targetDurationSeconds,
        restSeconds: re.restSeconds,
        notes: re.notes,
      }));
    } else if (exerciseIds && exerciseIds.length > 0) {
      targetExercises = exerciseIds.map((exId, idx) => ({
        exerciseId: exId,
        orderIndex: idx,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        targetWeightKg: 0,
        targetDurationSeconds: null,
        restSeconds: 60,
        notes: null,
      }));
    }

    // Insert session exercises and seed initial set slots
    const insertedSessionExercises = [];
    for (const ex of targetExercises) {
      const [se] = await db
        .insert(sessionExercises)
        .values({
          sessionId: newSession.id,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex,
          isSkipped: false,
          notes: ex.notes || null,
        })
        .returning();

      // Seed initial uncompleted set rows for convenient logging
      const setsToInsert = [];
      for (let s = 1; s <= ex.targetSets; s++) {
        setsToInsert.push({
          sessionExerciseId: se.id,
          setNumber: s,
          isWarmup: false,
          weightKg: ex.targetWeightKg || 0,
          repsCompleted: ex.targetRepsMax || 10,
          durationSeconds: ex.targetDurationSeconds || null,
          isCompleted: false,
        });
      }

      const createdSets = await db.insert(sessionSets).values(setsToInsert).returning();

      // Fetch exercise metadata
      const [exerciseDetails] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, ex.exerciseId))
        .limit(1);

      insertedSessionExercises.push({
        ...se,
        targetConfig: {
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          targetWeightKg: ex.targetWeightKg,
          targetDurationSeconds: ex.targetDurationSeconds,
          restSeconds: ex.restSeconds,
        },
        exercise: exerciseDetails,
        sets: createdSets,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout session started",
        data: {
          ...newSession,
          exercises: insertedSessionExercises,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/workouts/sessions/start error:", error);
    return NextResponse.json(
      { error: "Failed to start workout session", details: error.message },
      { status: 500 }
    );
  }
}

