import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exerciseCategories, exercises } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categoriesWithCount = await db
      .select({
        id: exerciseCategories.id,
        slug: exerciseCategories.slug,
        nameEn: exerciseCategories.nameEn,
        nameUr: exerciseCategories.nameUr,
        descriptionEn: exerciseCategories.descriptionEn,
        descriptionUr: exerciseCategories.descriptionUr,
        icon: exerciseCategories.icon,
        displayOrder: exerciseCategories.displayOrder,
        exerciseCount: sql<number>`cast(count(${exercises.id}) as int)`,
      })
      .from(exerciseCategories)
      .leftJoin(exercises, eq(exerciseCategories.id, exercises.categoryId))
      .groupBy(exerciseCategories.id)
      .orderBy(exerciseCategories.displayOrder);

    return NextResponse.json({ categories: categoriesWithCount }, { status: 200 });
  } catch (error: any) {
    console.error("[Get Exercise Categories Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

