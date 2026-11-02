import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  workoutSessions,
  sessionExercises,
  exercises,
  workoutRoutines,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    // Retrieve completed sessions
    const completedSessions = await db
      .select({
        session: workoutSessions,
        routine: workoutRoutines,
      })
      .from(workoutSessions)
      .leftJoin(workoutRoutines, eq(workoutSessions.routineId, workoutRoutines.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, "completed")
        )
      )
      .orderBy(desc(workoutSessions.startTime))
      .limit(limit)
      .offset(offset);

    const sessionIds = completedSessions.map((s) => s.session.id);

    let sessionExerciseDetails: Array<{
      sessionId: string;
      exerciseNameEn: string;
      exerciseNameUr: string;
      primaryMuscle: string;
    }> = [];

    if (sessionIds.length > 0) {
      const rows = await db
        .select({
          sessionId: sessionExercises.sessionId,
          exerciseNameEn: exercises.nameEn,
          exerciseNameUr: exercises.nameUr,
          primaryMuscle: exercises.primaryMuscle,
        })
        .from(sessionExercises)
        .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
        .where(inArray(sessionExercises.sessionId, sessionIds));

      sessionExerciseDetails = rows;
    }

    const formatted = completedSessions.map(({ session: s, routine: r }) => {
      const exs = sessionExerciseDetails.filter((e) => e.sessionId === s.id);
      return {
        ...s,
        routineName: r?.name || null,
        routineDifficulty: r?.difficulty || null,
        exercises: exs,
        exerciseCount: exs.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout history", details: error.message },
      { status: 500 }
    );
  }
}

