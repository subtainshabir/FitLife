import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { muscleGroups, exercises } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const musclesWithCount = await db
      .select({
        id: muscleGroups.id,
        slug: muscleGroups.slug,
        nameEn: muscleGroups.nameEn,
        nameUr: muscleGroups.nameUr,
        bodyRegion: muscleGroups.bodyRegion,
        view: muscleGroups.view,
        descriptionEn: muscleGroups.descriptionEn,
        descriptionUr: muscleGroups.descriptionUr,
        functionEn: muscleGroups.functionEn,
        functionUr: muscleGroups.functionUr,
        svgId: muscleGroups.svgId,
        displayOrder: muscleGroups.displayOrder,
        exerciseCount: sql<number>`cast(count(${exercises.id}) as int)`,
      })
      .from(muscleGroups)
      .leftJoin(exercises, eq(muscleGroups.id, exercises.primaryMuscleId))
      .groupBy(muscleGroups.id)
      .orderBy(muscleGroups.displayOrder);

    return NextResponse.json({ muscles: musclesWithCount }, { status: 200 });
  } catch (error: any) {
    console.error("[Get Muscles Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch muscle groups" },
      { status: 500 }
    );
  }
}

