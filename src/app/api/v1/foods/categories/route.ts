import { NextResponse } from "next/server";
import { db } from "@/db";
import { foodCategories, foodItems } from "@/db/schema";
import { asc, count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await db
      .select({
        id: foodCategories.id,
        slug: foodCategories.slug,
        nameEn: foodCategories.nameEn,
        nameUr: foodCategories.nameUr,
        descriptionEn: foodCategories.descriptionEn,
        descriptionUr: foodCategories.descriptionUr,
        icon: foodCategories.icon,
        displayOrder: foodCategories.displayOrder,
      })
      .from(foodCategories)
      .orderBy(asc(foodCategories.displayOrder));

    // Get count of foods in each category
    const counts = await db
      .select({
        categoryId: foodItems.categoryId,
        itemCount: count(foodItems.id),
      })
      .from(foodItems)
      .groupBy(foodItems.categoryId);

    const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.itemCount)]));

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      itemCount: countMap.get(cat.id) || 0,
    }));

    return NextResponse.json(
      {
        categories: categoriesWithCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving categories." },
      { status: 500 }
    );
  }
}

