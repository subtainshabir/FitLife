import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, foodCategories, foodPrices } from "@/db/schema";
import { foodSearchQuerySchema } from "@/lib/validations/food";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = foodSearchQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      foodType: searchParams.get("foodType") || undefined,
      minProtein: searchParams.get("minProtein") || undefined,
      maxCalories: searchParams.get("maxCalories") || undefined,
      city: searchParams.get("city") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || searchParams.get("pageSize") || 24,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      search,
      category,
      foodType,
      minProtein,
      maxCalories,
      city,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parsed.data;

    const offset = (page - 1) * limit;

    // Build conditions array
    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(foodItems.nameEn, pattern),
          ilike(foodItems.nameUr, pattern),
          ilike(foodItems.descriptionEn, pattern),
          ilike(foodItems.descriptionUr, pattern)
        )
      );
    }

    if (category) {
      // Check if category matches slug or id
      conditions.push(
        or(eq(foodCategories.slug, category), eq(foodCategories.id, category))
      );
    }

    if (foodType) {
      conditions.push(eq(foodItems.foodType, foodType));
    }

    if (minProtein !== undefined) {
      conditions.push(gte(foodItems.proteinPer100g, minProtein));
    }

    if (maxCalories !== undefined) {
      conditions.push(lte(foodItems.caloriesPer100g, maxCalories));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderByClause;
    if (sortBy === "protein") {
      orderByClause = sortOrder === "desc" ? desc(foodItems.proteinPer100g) : asc(foodItems.proteinPer100g);
    } else if (sortBy === "calories") {
      orderByClause = sortOrder === "desc" ? desc(foodItems.caloriesPer100g) : asc(foodItems.caloriesPer100g);
    } else {
      orderByClause = sortOrder === "desc" ? desc(foodItems.nameEn) : asc(foodItems.nameEn);
    }

    // Query items with category
    const items = await db
      .select({
        id: foodItems.id,
        categoryId: foodItems.categoryId,
        nameEn: foodItems.nameEn,
        nameUr: foodItems.nameUr,
        descriptionEn: foodItems.descriptionEn,
        descriptionUr: foodItems.descriptionUr,
        foodType: foodItems.foodType,
        defaultServingSize: foodItems.defaultServingSize,
        defaultServingUnit: foodItems.defaultServingUnit,
        servingWeightGrams: foodItems.servingWeightGrams,
        caloriesPer100g: foodItems.caloriesPer100g,
        proteinPer100g: foodItems.proteinPer100g,
        carbsPer100g: foodItems.carbsPer100g,
        fatPer100g: foodItems.fatPer100g,
        fibrePer100g: foodItems.fibrePer100g,
        nutritionSource: foodItems.nutritionSource,
        image: foodItems.image,
        categorySlug: foodCategories.slug,
        categoryNameEn: foodCategories.nameEn,
        categoryNameUr: foodCategories.nameUr,
        categoryIcon: foodCategories.icon,
      })
      .from(foodItems)
      .innerJoin(foodCategories, eq(foodItems.categoryId, foodCategories.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ total: sql<number>`count(*)` })
      .from(foodItems)
      .innerJoin(foodCategories, eq(foodItems.categoryId, foodCategories.id))
      .where(whereClause);

    const totalItems = Number(countResult?.total || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Attach active or verified local city prices if available
    const foodIds = items.map((i) => i.id);
    let priceMap: Record<string, any> = {};

    if (foodIds.length > 0) {
      let priceQuery = db
        .select()
        .from(foodPrices)
        .where(
          city
            ? and(sql`${foodPrices.foodId} IN ${foodIds}`, eq(foodPrices.city, city))
            : sql`${foodPrices.foodId} IN ${foodIds}`
        )
        .orderBy(desc(foodPrices.collectionDate));

      const foundPrices = await priceQuery;

      for (const p of foundPrices) {
        if (!priceMap[p.foodId]) {
          priceMap[p.foodId] = p;
        }
      }
    }

    const foodsWithPrices = items.map((item) => ({
      ...item,
      activePrice: priceMap[item.id] || null,
    }));

    // If sorting by price
    if (sortBy === "price") {
      foodsWithPrices.sort((a, b) => {
        const pA = a.activePrice?.pricePerStandardUnit ?? 999999;
        const pB = b.activePrice?.pricePerStandardUnit ?? 999999;
        return sortOrder === "desc" ? pB - pA : pA - pB;
      });
    }

    return NextResponse.json(
      {
        foods: foodsWithPrices,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filtersApplied: {
          search,
          category,
          foodType,
          minProtein,
          maxCalories,
          city,
          sortBy,
          sortOrder,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get foods error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving food items." },
      { status: 500 }
    );
  }
}
