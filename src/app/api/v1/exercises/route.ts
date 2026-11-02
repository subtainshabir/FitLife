import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, exerciseCategories, muscleGroups } from "@/db/schema";
import { exerciseFilterSchema } from "@/lib/validations/exercise";
import { eq, and, or, ilike, sql, desc, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const parsed = exerciseFilterSchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      search,
      category,
      muscle,
      equipment,
      difficulty,
      trainingType,
      isBodyweight,
      sortBy,
      sortOrder,
    } = parsed.data;

    const offset = (page - 1) * limit;

    // Build conditions array
    const conditions = [];

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(exercises.nameEn, term),
          ilike(exercises.nameUr, term),
          ilike(exercises.descriptionEn, term),
          ilike(exercises.slug, term)
        )
      );
    }

    if (category && category !== "all") {
      // Check if category is a UUID or slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        conditions.push(eq(exercises.categoryId, category));
      } else {
        // Resolve category slug by joining or subquery
        const [cat] = await db
          .select({ id: exerciseCategories.id })
          .from(exerciseCategories)
          .where(eq(exerciseCategories.slug, category))
          .limit(1);
        if (cat) {
          conditions.push(eq(exercises.categoryId, cat.id));
        }
      }
    }

    if (muscle && muscle !== "all") {
      conditions.push(eq(exercises.primaryMuscle, muscle));
    }

    if (equipment && equipment !== "all") {
      conditions.push(eq(exercises.equipment, equipment));
    }

    if (difficulty && difficulty !== "all") {
      conditions.push(eq(exercises.difficulty, difficulty));
    }

    if (trainingType && trainingType !== "all") {
      conditions.push(eq(exercises.trainingType, trainingType));
    }

    if (isBodyweight !== undefined) {
      conditions.push(eq(exercises.isBodyweight, isBodyweight));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    let orderColumn: any = exercises.nameEn;
    if (sortBy === "difficulty") orderColumn = exercises.difficulty;
    else if (sortBy === "calories") orderColumn = exercises.estimatedCaloriesPerMinute;
    else if (sortBy === "recent") orderColumn = exercises.createdAt;

    const orderFn = sortOrder === "desc" ? desc : asc;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(exercises)
      .where(whereClause);

    const total = Number(countResult?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Fetch paginated exercises
    const items = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        descriptionEn: exercises.descriptionEn,
        descriptionUr: exercises.descriptionUr,
        primaryMuscle: exercises.primaryMuscle,
        secondaryMuscles: exercises.secondaryMuscles,
        trainingType: exercises.trainingType,
        exerciseType: exercises.exerciseType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        movementPattern: exercises.movementPattern,
        isBodyweight: exercises.isBodyweight,
        estimatedMetValue: exercises.estimatedMetValue,
        estimatedCaloriesPerMinute: exercises.estimatedCaloriesPerMinute,
        demoMediaUrl: exercises.demoMediaUrl,
        thumbnailUrl: exercises.thumbnailUrl,
        mediaType: exercises.mediaType,
        mediaAttribution: exercises.mediaAttribution,
        isVerified: exercises.isVerified,
        createdAt: exercises.createdAt,
        categoryNameEn: exerciseCategories.nameEn,
        categoryNameUr: exerciseCategories.nameUr,
        categorySlug: exerciseCategories.slug,
        primaryMuscleNameEn: muscleGroups.nameEn,
        primaryMuscleNameUr: muscleGroups.nameUr,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .leftJoin(muscleGroups, eq(exercises.primaryMuscleId, muscleGroups.id))
      .where(whereClause)
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        exercises: items,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Get Exercises Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve exercises" },
      { status: 500 }
    );
  }
}
