import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodPrices, foodItems, foodCategories, priceSources } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.trim();
    const category = searchParams.get("category")?.trim();
    const status = searchParams.get("status")?.trim();

    // Query distinct cities present in the database dynamically
    const cityResults = await db
      .select({ city: foodPrices.city, province: foodPrices.province })
      .from(foodPrices)
      .groupBy(foodPrices.city, foodPrices.province)
      .orderBy(foodPrices.city);

    const availableCities = cityResults.map((c) => ({
      city: c.city,
      province: c.province,
    }));

    // Build filter conditions
    const conditions = [];
    if (city) {
      conditions.push(eq(foodPrices.city, city));
    }
    if (status) {
      conditions.push(eq(foodPrices.verificationStatus, status));
    }
    if (category) {
      conditions.push(
        sql`${foodItems.categoryId} IN (SELECT id FROM ${foodCategories} WHERE ${foodCategories.slug} = ${category} OR ${foodCategories.id} = ${category})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const prices = await db
      .select({
        id: foodPrices.id,
        foodId: foodPrices.foodId,
        foodNameEn: foodItems.nameEn,
        foodNameUr: foodItems.nameUr,
        foodImage: foodItems.image,
        categorySlug: foodCategories.slug,
        categoryNameEn: foodCategories.nameEn,
        categoryNameUr: foodCategories.nameUr,
        proteinPer100g: foodItems.proteinPer100g,
        caloriesPer100g: foodItems.caloriesPer100g,
        country: foodPrices.country,
        province: foodPrices.province,
        city: foodPrices.city,
        marketRetailer: foodPrices.marketRetailer,
        price: foodPrices.price,
        quantity: foodPrices.quantity,
        unit: foodPrices.unit,
        pricePerStandardUnit: foodPrices.pricePerStandardUnit,
        standardUnit: foodPrices.standardUnit,
        currency: foodPrices.currency,
        collectionDate: foodPrices.collectionDate,
        verificationStatus: foodPrices.verificationStatus,
        confidenceLevel: foodPrices.confidenceLevel,
        notes: foodPrices.notes,
        sourceName: priceSources.name,
        sourceType: priceSources.sourceType,
      })
      .from(foodPrices)
      .innerJoin(foodItems, eq(foodPrices.foodId, foodItems.id))
      .innerJoin(foodCategories, eq(foodItems.categoryId, foodCategories.id))
      .leftJoin(priceSources, eq(foodPrices.sourceId, priceSources.id))
      .where(whereClause)
      .orderBy(desc(foodPrices.collectionDate))
      .limit(100);

    return NextResponse.json(
      {
        availableCities,
        selectedCity: city || "All Cities",
        total: prices.length,
        prices,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get price catalog error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving price catalog." },
      { status: 500 }
    );
  }
}

