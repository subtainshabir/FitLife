import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  workoutSessions,
  sessionExercises,
  sessionSets,
  exercises,
  userProfiles,
} from "@/db/schema";
import { logSetSchema } from "@/lib/validations/workout";
import {
  calculateSessionSummary,
  evaluateAndSavePersonalRecords,
} from "@/lib/services/workout-service";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
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

    // Verify session belongs to user
    const [workoutSession] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!workoutSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = logSetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      sessionExerciseId,
      setNumber,
      isWarmup,
      weightKg,
      repsCompleted,
      durationSeconds,
      isCompleted,
      rpe,
    } = parsed.data;

    // Verify session exercise
    const [se] = await db
      .select({
        sessionExercise: sessionExercises,
        exercise: exercises,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(
        and(
          eq(sessionExercises.id, sessionExerciseId),
          eq(sessionExercises.sessionId, sessionId)
        )
      )
      .limit(1);

    if (!se) {
      return NextResponse.json({ error: "Session exercise not found" }, { status: 404 });
    }

    // Check if set already exists
    const [existingSet] = await db
      .select()
      .from(sessionSets)
      .where(
        and(
          eq(sessionSets.sessionExerciseId, sessionExerciseId),
          eq(sessionSets.setNumber, setNumber)
        )
      )
      .limit(1);

    let loggedSet;
    if (existingSet) {
      const [updated] = await db
        .update(sessionSets)
        .set({
          isWarmup,
          weightKg,
          repsCompleted,
          durationSeconds: durationSeconds || null,
          isCompleted,
          rpe: rpe || null,
          completedAt: isCompleted ? new Date() : null,
        })
        .where(eq(sessionSets.id, existingSet.id))
        .returning();
      loggedSet = updated;
    } else {
      const [inserted] = await db
        .insert(sessionSets)
        .values({
          sessionExerciseId,
          setNumber,
          isWarmup,
          weightKg,
          repsCompleted,
          durationSeconds: durationSeconds || null,
          isCompleted,
          rpe: rpe || null,
          completedAt: isCompleted ? new Date() : null,
        })
        .returning();
      loggedSet = inserted;
    }

    // Retrieve user bodyweight if available
    const [profile] = await db
      .select({ currentWeight: userProfiles.currentWeight })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    const userWeight = profile?.currentWeight || 65;

    // Check and save PRs for this exercise
    let newRecords: any[] = [];
    if (isCompleted && !isWarmup) {
      // Get all sets for this exercise to evaluate
      const allExSets = await db
        .select()
        .from(sessionSets)
        .where(eq(sessionSets.sessionExerciseId, sessionExerciseId));

      newRecords = await evaluateAndSavePersonalRecords(
        userId,
        se.exercise.id,
        allExSets.map((s) => ({
          weightKg: s.weightKg,
          repsCompleted: s.repsCompleted,
          durationSeconds: s.durationSeconds,
          isWarmup: s.isWarmup,
          isCompleted: s.isCompleted,
          isBodyweight: se.exercise.isBodyweight,
        })),
        sessionId,
        userWeight
      );
    }

    // Recalculate session totals
    const allSessionSets = await db
      .select({
        set: sessionSets,
        exercise: exercises,
      })
      .from(sessionSets)
      .innerJoin(
        sessionExercises,
        eq(sessionSets.sessionExerciseId, sessionExercises.id)
      )
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, sessionId));

    const summary = calculateSessionSummary(
      allSessionSets.map((row) => ({
        weightKg: row.set.weightKg,
        repsCompleted: row.set.repsCompleted,
        isCompleted: row.set.isCompleted,
        isWarmup: row.set.isWarmup,
        durationSeconds: row.set.durationSeconds,
        isBodyweight: row.exercise.isBodyweight,
      })),
      userWeight
    );

    // Update workout session
    await db
      .update(workoutSessions)
      .set({
        totalVolumeKg: summary.totalVolumeKg,
        totalSetsCompleted: summary.totalSetsCompleted,
        totalRepsCompleted: summary.totalRepsCompleted,
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: "Set logged successfully",
      data: {
        set: loggedSet,
        newRecords,
        sessionStats: summary,
      },
    });
  } catch (error: any) {
    console.error("POST /api/v1/workouts/sessions/[id]/sets error:", error);
    return NextResponse.json(
      { error: "Failed to log set", details: error.message },
      { status: 500 }
    );
  }
}

