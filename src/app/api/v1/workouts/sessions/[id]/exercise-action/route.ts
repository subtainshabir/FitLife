import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutSessions, sessionExercises, exercises } from "@/db/schema";
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

    // Verify session
    const [ws] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!ws) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, sessionExerciseId, replacementExerciseId, notes } = body;

    if (!sessionExerciseId) {
      return NextResponse.json({ error: "sessionExerciseId is required" }, { status: 400 });
    }

    if (action === "skip") {
      const [updated] = await db
        .update(sessionExercises)
        .set({
          isSkipped: true,
          notes: notes || "Skipped by user",
        })
        .where(
          and(
            eq(sessionExercises.id, sessionExerciseId),
            eq(sessionExercises.sessionId, sessionId)
          )
        )
        .returning();

      return NextResponse.json({
        success: true,
        message: "Exercise skipped",
        data: updated,
      });
    }

    if (action === "substitute") {
      if (!replacementExerciseId) {
        return NextResponse.json(
          { error: "replacementExerciseId is required for substitution" },
          { status: 400 }
        );
      }

      // Check replacement exercise exists
      const [repEx] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, replacementExerciseId))
        .limit(1);

      if (!repEx) {
        return NextResponse.json({ error: "Replacement exercise not found" }, { status: 404 });
      }

      const [updated] = await db
        .update(sessionExercises)
        .set({
          exerciseId: replacementExerciseId,
          replacedWithExerciseId: replacementExerciseId,
          notes: notes || `Substituted with ${repEx.nameEn}`,
        })
        .where(
          and(
            eq(sessionExercises.id, sessionExerciseId),
            eq(sessionExercises.sessionId, sessionId)
          )
        )
        .returning();

      return NextResponse.json({
        success: true,
        message: `Substituted with ${repEx.nameEn}`,
        data: {
          ...updated,
          exercise: repEx,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/v1/workouts/sessions/[id]/exercise-action error:", error);
    return NextResponse.json(
      { error: "Failed to process exercise action", details: error.message },
      { status: 500 }
    );
  }
}

