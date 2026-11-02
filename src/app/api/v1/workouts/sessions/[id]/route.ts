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
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const sessionId = params.id;

    const [workoutSession] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!workoutSession) {
      return NextResponse.json({ error: "Workout session not found" }, { status: 404 });
    }

    const sessionExList = await db
      .select({
        sessionExercise: sessionExercises,
        exercise: exercises,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, sessionId))
      .orderBy(asc(sessionExercises.orderIndex));

    const exIds = sessionExList.map((se) => se.sessionExercise.id);
    let allSets: (typeof sessionSets.$inferSelect)[] = [];
    if (exIds.length > 0) {
      allSets = await db.select().from(sessionSets);
    }

    let routineTargets: (typeof routineExercises.$inferSelect)[] = [];
    if (workoutSession.routineId) {
      routineTargets = await db
        .select()
        .from(routineExercises)
        .where(eq(routineExercises.routineId, workoutSession.routineId));
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
        ...workoutSession,
        exercises: structuredExercises,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/sessions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const sessionId = params.id;

    const body = await req.json();

    const [updated] = await db
      .update(workoutSessions)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/v1/workouts/sessions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update session", details: error.message },
      { status: 500 }
    );
  }
}

