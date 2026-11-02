import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutRoutines, routineExercises, exercises } from "@/db/schema";
import { checkMuscleRecovery } from "@/lib/services/workout-service";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    let targetMuscles: string[] = body.targetMuscles || [];

    // If routineId passed, derive target muscles from routine exercises
    if (body.routineId && targetMuscles.length === 0) {
      const routineExs = await db
        .select({
          primaryMuscle: exercises.primaryMuscle,
          secondaryMuscles: exercises.secondaryMuscles,
        })
        .from(routineExercises)
        .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
        .where(eq(routineExercises.routineId, body.routineId));

      const musclesSet = new Set<string>();
      for (const re of routineExs) {
        musclesSet.add(re.primaryMuscle);
        if (Array.isArray(re.secondaryMuscles)) {
          for (const sm of re.secondaryMuscles) {
            musclesSet.add(sm);
          }
        }
      }
      targetMuscles = Array.from(musclesSet);
    }

    const recoveryStatus = await checkMuscleRecovery(userId, targetMuscles);

    return NextResponse.json({
      success: true,
      data: recoveryStatus,
    });
  } catch (error: any) {
    console.error("POST /api/v1/workouts/recovery-check error:", error);
    return NextResponse.json(
      { error: "Failed to check recovery status", details: error.message },
      { status: 500 }
    );
  }
}

