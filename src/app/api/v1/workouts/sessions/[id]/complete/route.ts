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
import { completeSessionSchema } from "@/lib/validations/workout";
import {
  calculateSessionSummary,
  evaluateAndSavePersonalRecords,
  type NewRecordAchieved,
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

    const [workoutSession] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!workoutSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = completeSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { durationSeconds, rating, perceivedExertionRpe, notes } = parsed.data;

    // Fetch user profile for weight & calorie estimation
    const [profile] = await db
      .select({ currentWeight: userProfiles.currentWeight })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    const userWeight = profile?.currentWeight || 70;

    // Fetch all session exercises and sets
    const sessionExs = await db
      .select({
        sessionExercise: sessionExercises,
        exercise: exercises,
      })
      .from(sessionExercises)
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, sessionId));

    const exIds = sessionExs.map((se) => se.sessionExercise.id);
    let allSets: (typeof sessionSets.$inferSelect)[] = [];
    if (exIds.length > 0) {
      allSets = await db.select().from(sessionSets);
    }

    // Evaluate PRs for each exercise
    const allNewRecords: NewRecordAchieved[] = [];

    for (const se of sessionExs) {
      if (se.sessionExercise.isSkipped) continue;

      const exSets = allSets.filter(
        (s) => s.sessionExerciseId === se.sessionExercise.id && s.isCompleted
      );

      if (exSets.length > 0) {
        const prs = await evaluateAndSavePersonalRecords(
          userId,
          se.exercise.id,
          exSets.map((s) => ({
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
        allNewRecords.push(...prs);
      }
    }

    // Calculate final summary
    const summary = calculateSessionSummary(
      allSets
        .filter((s) => exIds.includes(s.sessionExerciseId))
        .map((s) => ({
          weightKg: s.weightKg,
          repsCompleted: s.repsCompleted,
          isCompleted: s.isCompleted,
          isWarmup: s.isWarmup,
          durationSeconds: s.durationSeconds,
        })),
      userWeight
    );

    // Calculate estimated calories burned
    // MET standard for resistance training is ~5.0 - 6.0 METs
    // Calories = MET * weight(kg) * (duration_minutes / 60)
    const durationMins = Math.max(1, Math.round((durationSeconds || 1800) / 60));
    const avgMet = 5.5;
    const caloriesBurned = Math.round(avgMet * userWeight * (durationMins / 60));

    // Update workout session to completed
    const [completed] = await db
      .update(workoutSessions)
      .set({
        status: "completed",
        endTime: new Date(),
        durationSeconds,
        totalVolumeKg: summary.totalVolumeKg,
        totalSetsCompleted: summary.totalSetsCompleted,
        totalRepsCompleted: summary.totalRepsCompleted,
        estimatedCaloriesBurned: caloriesBurned,
        rating: rating || null,
        perceivedExertionRpe: perceivedExertionRpe || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, sessionId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Workout completed successfully! Excellent job!",
      data: {
        session: completed,
        newRecords: allNewRecords,
        summary: {
          ...summary,
          caloriesBurned,
          durationFormatted: `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        },
      },
    });
  } catch (error: any) {
    console.error("POST /api/v1/workouts/sessions/[id]/complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete workout session", details: error.message },
      { status: 500 }
    );
  }
}

