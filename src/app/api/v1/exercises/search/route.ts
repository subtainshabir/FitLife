import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exercises, exerciseCategories, muscleGroups } from "@/db/schema";
import { exerciseSearchSchema } from "@/lib/validations/exercise";
import { or, ilike, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const term = `%${q.trim()}%`;

    const results = await db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        nameEn: exercises.nameEn,
        nameUr: exercises.nameUr,
        primaryMuscle: exercises.primaryMuscle,
        trainingType: exercises.trainingType,
        difficulty: exercises.difficulty,
        equipment: exercises.equipment,
        categorySlug: exerciseCategories.slug,
        categoryNameEn: exerciseCategories.nameEn,
      })
      .from(exercises)
      .leftJoin(exerciseCategories, eq(exercises.categoryId, exerciseCategories.id))
      .where(
        or(
          ilike(exercises.nameEn, term),
          ilike(exercises.nameUr, term),
          ilike(exercises.slug, term),
          ilike(exercises.primaryMuscle, term)
        )
      )
      .limit(limit);

    return NextResponse.json({ results }, { status: 200 });
  } catch (error: any) {
    console.error("[Exercise Search Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}

