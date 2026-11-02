import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
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

    const [ws] = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
      .limit(1);

    if (!ws) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const [cancelled] = await db
      .update(workoutSessions)
      .set({
        status: "cancelled",
        endTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, sessionId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Session cancelled",
      data: cancelled,
    });
  } catch (error: any) {
    console.error("POST /api/v1/workouts/sessions/[id]/cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel session", details: error.message },
      { status: 500 }
    );
  }
}

