import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutRoutines, routineExercises } from "@/db/schema";
import { eq, and, or, asc } from "drizzle-orm";

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
    const sourceRoutineId = params.id;

    // Fetch source routine
    const [source] = await db
      .select()
      .from(workoutRoutines)
      .where(
        and(
          eq(workoutRoutines.id, sourceRoutineId),
          or(eq(workoutRoutines.userId, userId), eq(workoutRoutines.isTemplate, true))
        )
      )
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: "Source routine not found" }, { status: 404 });
    }

    // Fetch exercises
    const sourceExs = await db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, sourceRoutineId))
      .orderBy(asc(routineExercises.orderIndex));

    // Clone routine as user's own
    const [cloned] = await db
      .insert(workoutRoutines)
      .values({
        userId,
        name: `${source.name} (Copy)`,
        nameUr: source.nameUr ? `${source.nameUr} (کاپی)` : null,
        description: source.description,
        descriptionUr: source.descriptionUr,
        difficulty: source.difficulty,
        targetDurationMinutes: source.targetDurationMinutes,
        splitType: source.splitType,
        tags: source.tags,
        isTemplate: false,
        isArchived: false,
      })
      .returning();

    // Clone exercises
    if (sourceExs.length > 0) {
      const clonedExercises = sourceExs.map((ex) => ({
        routineId: cloned.id,
        exerciseId: ex.exerciseId,
        orderIndex: ex.orderIndex,
        targetSets: ex.targetSets,
        targetRepsMin: ex.targetRepsMin,
        targetRepsMax: ex.targetRepsMax,
        targetWeightKg: ex.targetWeightKg,
        targetDurationSeconds: ex.targetDurationSeconds,
        restSeconds: ex.restSeconds,
        notes: ex.notes,
        notesUr: ex.notesUr,
      }));

      await db.insert(routineExercises).values(clonedExercises);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Routine duplicated successfully",
        data: cloned,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/workouts/routines/[id]/duplicate error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate routine", details: error.message },
      { status: 500 }
    );
  }
}

