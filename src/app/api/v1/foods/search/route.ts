import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, foodCategories } from "@/db/schema";
import { ilike, or, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ foods: [] }, { status: 200 });
    }

    const searchPattern = `%${query}%`;

    const results = await db
      .select({
        id: foodItems.id,
        nameEn: foodItems.nameEn,
        nameUr: foodItems.nameUr,
        foodType: foodItems.foodType,
        defaultServingSize: foodItems.defaultServingSize,
        defaultServingUnit: foodItems.defaultServingUnit,
        servingWeightGrams: foodItems.servingWeightGrams,
        caloriesPer100g: foodItems.caloriesPer100g,
        proteinPer100g: foodItems.proteinPer100g,
        carbsPer100g: foodItems.carbsPer100g,
        fatPer100g: foodItems.fatPer100g,
        fibrePer100g: foodItems.fibrePer100g,
        image: foodItems.image,
        categoryNameEn: foodCategories.nameEn,
        categoryNameUr: foodCategories.nameUr,
        categorySlug: foodCategories.slug,
      })
      .from(foodItems)
      .innerJoin(foodCategories, eq(foodItems.categoryId, foodCategories.id))
      .where(
        or(
          ilike(foodItems.nameEn, searchPattern),
          ilike(foodItems.nameUr, searchPattern),
          ilike(foodItems.descriptionEn, searchPattern),
          ilike(foodItems.descriptionUr, searchPattern)
        )
      )
      .limit(20);

    return NextResponse.json({ foods: results }, { status: 200 });
  } catch (error) {
    console.error("Search foods error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while searching foods." },
      { status: 500 }
    );
  }
}

