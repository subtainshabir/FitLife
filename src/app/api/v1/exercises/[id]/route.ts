import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, exerciseCategories, muscleGroups } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const [exercise] = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        descriptionEn: exercises.descriptionEn,
        descriptionUr: exercises.descriptionUr,
        categoryId: exercises.categoryId,
        categorySlug: exerciseCategories.slug,
        categoryNameEn: exerciseCategories.nameEn,
        categoryNameUr: exerciseCategories.nameUr,
        primaryMuscleId: exercises.primaryMuscleId,
        primaryMuscle: exercises.primaryMuscle,
        primaryMuscleNameEn: muscleGroups.nameEn,
        primaryMuscleNameUr: muscleGroups.nameUr,
        secondaryMuscles: exercises.secondaryMuscles,
        trainingType: exercises.trainingType,
        exerciseType: exercises.exerciseType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        movementPattern: exercises.movementPattern,
        isBodyweight: exercises.isBodyweight,
        startingPositionEn: exercises.startingPositionEn,
        startingPositionUr: exercises.startingPositionUr,
        executionStepsEn: exercises.executionStepsEn,
        executionStepsUr: exercises.executionStepsUr,
        breathingPatternEn: exercises.breathingPatternEn,
        breathingPatternUr: exercises.breathingPatternUr,
        safetyPrecautionsEn: exercises.safetyPrecautionsEn,
        safetyPrecautionsUr: exercises.safetyPrecautionsUr,
        commonMistakesEn: exercises.commonMistakesEn,
        commonMistakesUr: exercises.commonMistakesUr,
        easierVariation: exercises.easierVariation,
        harderVariation: exercises.harderVariation,
        alternativeExerciseIds: exercises.alternativeExerciseIds,
        estimatedMetValue: exercises.estimatedMetValue,
        estimatedCaloriesPerMinute: exercises.estimatedCaloriesPerMinute,
        demoMediaUrl: exercises.demoMediaUrl,
        thumbnailUrl: exercises.thumbnailUrl,
        mediaType: exercises.mediaType,
        mediaAttribution: exercises.mediaAttribution,
        isVerified: exercises.isVerified,
        createdAt: exercises.createdAt,
        updatedAt: exercises.updatedAt,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .leftJoin(muscleGroups, eq(exercises.primaryMuscleId, muscleGroups.id))
      .where(isUuid ? eq(exercises.id, id) : eq(exercises.slug, id.toLowerCase()))
      .limit(1);

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json({ exercise }, { status: 200 });
  } catch (error: any) {
    console.error("[Get Exercise Details Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve exercise" },
      { status: 500 }
    );
  }
}

