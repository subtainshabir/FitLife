import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutSessions, sessionExercises, sessionSets } from "@/db/schema";
import { updateSetSchema } from "@/lib/validations/workout";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; setId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id: sessionId, setId } = params;

    // Verify session belongs to user
    const [ws] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!ws) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(sessionSets)
      .set({
        ...parsed.data,
        completedAt: parsed.data.isCompleted ? new Date() : null,
      })
      .where(eq(sessionSets.id, setId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/v1/workouts/sessions/[id]/sets/[setId] error:", error);
    return NextResponse.json(
      { error: "Failed to update set", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; setId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id: sessionId, setId } = params;

    const [ws] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!ws) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await db.delete(sessionSets).where(eq(sessionSets.id, setId));

    return NextResponse.json({
      success: true,
      message: "Set removed",
    });
  } catch (error: any) {
    console.error("DELETE /api/v1/workouts/sessions/[id]/sets/[setId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete set", details: error.message },
      { status: 500 }
    );
  }
}

