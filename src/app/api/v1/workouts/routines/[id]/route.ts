import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutRoutines, routineExercises, exercises } from "@/db/schema";
import { updateRoutineSchema } from "@/lib/validations/workout";
import { eq, and, or, asc } from "drizzle-orm";

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
    const routineId = params.id;

    // Fetch routine if owned by user or is a template
    const [routine] = await db
      .select()
      .from(workoutRoutines)
      .where(
        and(
          eq(workoutRoutines.id, routineId),
          or(eq(workoutRoutines.userId, userId), eq(workoutRoutines.isTemplate, true))
        )
      )
      .limit(1);

    if (!routine) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    // Fetch ordered exercises with details
    const routineExs = await db
      .select({
        routineExercise: routineExercises,
        exercise: exercises,
      })
      .from(routineExercises)
      .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
      .where(eq(routineExercises.routineId, routineId))
      .orderBy(asc(routineExercises.orderIndex));

    const formattedExercises = routineExs.map((row) => ({
      ...row.routineExercise,
      exercise: row.exercise,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...routine,
        exercises: formattedExercises,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/routines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch routine", details: error.message },
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
    const routineId = params.id;

    // Verify user owns the routine (cannot edit templates)
    const [existing] = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, routineId), eq(workoutRoutines.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Routine not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateRoutineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { exercises: newExercises, ...updateFields } = parsed.data;

    // Update routine fields
    await db
      .update(workoutRoutines)
      .set({
        ...updateFields,
        updatedAt: new Date(),
      })
      .where(eq(workoutRoutines.id, routineId));

    // If new exercises array provided, replace exercises
    if (newExercises !== undefined) {
      await db
        .delete(routineExercises)
        .where(eq(routineExercises.routineId, routineId));

      if (newExercises.length > 0) {
        const inserts = newExercises.map((ex, index) => ({
          routineId,
          exerciseId: ex.exerciseId,
          orderIndex: ex.orderIndex ?? index,
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          targetWeightKg: ex.targetWeightKg,
          targetDurationSeconds: ex.targetDurationSeconds || null,
          restSeconds: ex.restSeconds,
          notes: ex.notes || null,
          notesUr: ex.notesUr || null,
        }));
        await db.insert(routineExercises).values(inserts);
      }
    }

    // Return updated routine
    const [updated] = await db
      .select()
      .from(workoutRoutines)
      .where(eq(workoutRoutines.id, routineId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Workout routine updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/v1/workouts/routines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update routine", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const routineId = params.id;

    // Verify user owns the routine
    const [existing] = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, routineId), eq(workoutRoutines.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Routine not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    await db.delete(workoutRoutines).where(eq(workoutRoutines.id, routineId));

    return NextResponse.json({
      success: true,
      message: "Routine deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/v1/workouts/routines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete routine", details: error.message },
      { status: 500 }
    );
  }
}

