import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, exerciseCategories, muscleGroups } from "@/db/schema";
import { eq, and, ne, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const [current] = await db
      .select({
        id: exercises.id,
        categoryId: exercises.categoryId,
        primaryMuscle: exercises.primaryMuscle,
      })
      .from(exercises)
      .where(isUuid ? eq(exercises.id, id) : eq(exercises.slug, id.toLowerCase()))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const related = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        primaryMuscle: exercises.primaryMuscle,
        trainingType: exercises.trainingType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        estimatedCaloriesPerMinute: exercises.estimatedCaloriesPerMinute,
        thumbnailUrl: exercises.thumbnailUrl,
        categoryNameEn: exerciseCategories.nameEn,
        categorySlug: exerciseCategories.slug,
        primaryMuscleNameEn: muscleGroups.nameEn,
        primaryMuscleNameUr: muscleGroups.nameUr,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .leftJoin(muscleGroups, eq(exercises.primaryMuscleId, muscleGroups.id))
      .where(
        and(
          ne(exercises.id, current.id),
          or(
            eq(exercises.primaryMuscle, current.primaryMuscle),
            eq(exercises.categoryId, current.categoryId)
          )
        )
      )
      .limit(6);

    return NextResponse.json({ related }, { status: 200 });
  } catch (error: any) {
    console.error("[Get Related Exercises Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch related exercises" },
      { status: 500 }
    );
  }
}

