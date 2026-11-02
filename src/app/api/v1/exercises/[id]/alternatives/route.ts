import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, exerciseCategories, muscleGroups } from "@/db/schema";
import { eq, and, ne, or, ilike } from "drizzle-orm";

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
        nameEn: exercises.nameEn,
        primaryMuscle: exercises.primaryMuscle,
        easierVariation: exercises.easierVariation,
        harderVariation: exercises.harderVariation,
        isBodyweight: exercises.isBodyweight,
        equipment: exercises.equipment,
      })
      .from(exercises)
      .where(isUuid ? eq(exercises.id, id) : eq(exercises.slug, id.toLowerCase()))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Find candidate alternatives in the library targeting the same primary muscle
    const candidates = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        primaryMuscle: exercises.primaryMuscle,
        trainingType: exercises.trainingType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        isBodyweight: exercises.isBodyweight,
        estimatedCaloriesPerMinute: exercises.estimatedCaloriesPerMinute,
        thumbnailUrl: exercises.thumbnailUrl,
        categoryNameEn: exerciseCategories.nameEn,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .where(
        and(
          ne(exercises.id, current.id),
          eq(exercises.primaryMuscle, current.primaryMuscle)
        )
      )
      .limit(6);

    return NextResponse.json(
      {
        exercise: {
          id: current.id,
          nameEn: current.nameEn,
          easierVariationNote: current.easierVariation,
          harderVariationNote: current.harderVariation,
        },
        alternatives: candidates,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Get Exercise Alternatives Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch alternative exercises" },
      { status: 500 }
    );
  }
}

