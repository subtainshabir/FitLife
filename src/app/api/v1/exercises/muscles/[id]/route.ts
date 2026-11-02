import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { muscleGroups, exercises, exerciseCategories } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Support lookup by UUID or slug (e.g. "chest")
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const [muscle] = await db
      .select()
      .from(muscleGroups)
      .where(isUuid ? eq(muscleGroups.id, id) : eq(muscleGroups.slug, id.toLowerCase()))
      .limit(1);

    if (!muscle) {
      return NextResponse.json({ error: "Muscle group not found" }, { status: 404 });
    }

    // Retrieve exercises where this is the primary muscle
    const primaryExercises = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        primaryMuscle: exercises.primaryMuscle,
        secondaryMuscles: exercises.secondaryMuscles,
        trainingType: exercises.trainingType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        estimatedCaloriesPerMinute: exercises.estimatedCaloriesPerMinute,
        thumbnailUrl: exercises.thumbnailUrl,
        categoryNameEn: exerciseCategories.nameEn,
        categorySlug: exerciseCategories.slug,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .where(eq(exercises.primaryMuscleId, muscle.id));

    // Retrieve exercises where this muscle is listed as secondary
    const secondaryExercises = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        primaryMuscle: exercises.primaryMuscle,
        secondaryMuscles: exercises.secondaryMuscles,
        trainingType: exercises.trainingType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        estimatedCaloriesPerMinute: exercises.estimatedCaloriesPerMinute,
        thumbnailUrl: exercises.thumbnailUrl,
        categoryNameEn: exerciseCategories.nameEn,
        categorySlug: exerciseCategories.slug,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .where(sql`${exercises.secondaryMuscles} @> ${JSON.stringify([muscle.slug])}::jsonb`);

    return NextResponse.json(
      {
        muscle,
        primaryExercises,
        secondaryExercises,
        totalTargetingExercises: primaryExercises.length + secondaryExercises.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Get Muscle Detail Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch muscle group details" },
      { status: 500 }
    );
  }
}

