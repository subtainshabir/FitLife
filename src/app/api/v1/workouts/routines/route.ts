import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutRoutines, routineExercises, exercises } from "@/db/schema";
import { createRoutineSchema } from "@/lib/validations/workout";
import { eq, and, or, desc, asc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type") || "all"; // all, my_routines, templates
    const difficulty = searchParams.get("difficulty");
    const splitType = searchParams.get("splitType");

    // Build conditions
    let userCondition;
    if (filterType === "my_routines") {
      userCondition = eq(workoutRoutines.userId, userId);
    } else if (filterType === "templates") {
      userCondition = eq(workoutRoutines.isTemplate, true);
    } else {
      userCondition = or(eq(workoutRoutines.userId, userId), eq(workoutRoutines.isTemplate, true));
    }

    const routinesList = await db
      .select()
      .from(workoutRoutines)
      .where(
        and(
          userCondition,
          eq(workoutRoutines.isArchived, false),
          difficulty ? eq(workoutRoutines.difficulty, difficulty) : undefined,
          splitType ? eq(workoutRoutines.splitType, splitType) : undefined
        )
      )
      .orderBy(desc(workoutRoutines.isTemplate), desc(workoutRoutines.createdAt));

    // Fetch exercises for each routine
    const routineIds = routinesList.map((r) => r.id);
    let exercisesWithDetails: Array<{
      routineExercise: typeof routineExercises.$inferSelect;
      exercise: typeof exercises.$inferSelect;
    }> = [];

    if (routineIds.length > 0) {
      const rows = await db
        .select({
          routineExercise: routineExercises,
          exercise: exercises,
        })
        .from(routineExercises)
        .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
        .orderBy(asc(routineExercises.orderIndex));

      exercisesWithDetails = rows.filter((row) =>
        routineIds.includes(row.routineExercise.routineId)
      );
    }

    // Map exercises to routines
    const routinesWithExercises = routinesList.map((routine) => {
      const routineExs = exercisesWithDetails
        .filter((item) => item.routineExercise.routineId === routine.id)
        .sort((a, b) => a.routineExercise.orderIndex - b.routineExercise.orderIndex)
        .map((item) => ({
          ...item.routineExercise,
          exercise: item.exercise,
        }));

      return {
        ...routine,
        exerciseCount: routineExs.length,
        exercises: routineExs,
      };
    });

    return NextResponse.json({
      success: true,
      data: routinesWithExercises,
      total: routinesWithExercises.length,
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/routines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch routines", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createRoutineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { exercises: routineExs, ...routineData } = parsed.data;

    // Insert routine
    const [newRoutine] = await db
      .insert(workoutRoutines)
      .values({
        userId,
        name: routineData.name,
        nameUr: routineData.nameUr || null,
        description: routineData.description || null,
        descriptionUr: routineData.descriptionUr || null,
        difficulty: routineData.difficulty,
        targetDurationMinutes: routineData.targetDurationMinutes,
        splitType: routineData.splitType,
        tags: routineData.tags,
        isTemplate: false,
        isArchived: false,
      })
      .returning();

    // Insert exercises
    if (routineExs && routineExs.length > 0) {
      const exerciseInserts = routineExs.map((ex, index) => ({
        routineId: newRoutine.id,
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

      await db.insert(routineExercises).values(exerciseInserts);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout routine created successfully",
        data: newRoutine,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/workouts/routines error:", error);
    return NextResponse.json(
      { error: "Failed to create workout routine", details: error.message },
      { status: 500 }
    );
  }
}

