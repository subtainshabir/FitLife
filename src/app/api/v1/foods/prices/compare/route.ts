import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodPrices, foodItems, foodCategories } from "@/db/schema";
import { rankProteinCostEfficiency } from "@/lib/services/nutrition-calculator";
import { and, desc, eq, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.trim() || "Rawalpindi";

    // Query protein foods in the specified city
    const items = await db
      .select({
        foodId: foodItems.id,
        nameEn: foodItems.nameEn,
        nameUr: foodItems.nameUr,
        defaultServingSize: foodItems.defaultServingSize,
        defaultServingUnit: foodItems.defaultServingUnit,
        servingWeightGrams: foodItems.servingWeightGrams,
        caloriesPer100g: foodItems.caloriesPer100g,
        proteinPer100g: foodItems.proteinPer100g,
        carbsPer100g: foodItems.carbsPer100g,
        fatPer100g: foodItems.fatPer100g,
        fibrePer100g: foodItems.fibrePer100g,
        image: foodItems.image,
        priceId: foodPrices.id,
        city: foodPrices.city,
        marketRetailer: foodPrices.marketRetailer,
        price: foodPrices.price,
        quantity: foodPrices.quantity,
        unit: foodPrices.unit,
        pricePerStandardUnit: foodPrices.pricePerStandardUnit,
        standardUnit: foodPrices.standardUnit,
        currency: foodPrices.currency,
        verificationStatus: foodPrices.verificationStatus,
        confidenceLevel: foodPrices.confidenceLevel,
        collectionDate: foodPrices.collectionDate,
      })
      .from(foodPrices)
      .innerJoin(foodItems, eq(foodPrices.foodId, foodItems.id))
      .where(and(eq(foodPrices.city, city), gte(foodItems.proteinPer100g, 3.0)))
      .orderBy(desc(foodPrices.collectionDate));

    // Deduplicate foods by choosing latest price per food
    const seen = new Set<string>();
    const uniquePairs: Array<any> = [];

    for (const row of items) {
      if (!seen.has(row.foodId)) {
        seen.add(row.foodId);
        uniquePairs.push({
          food: {
            id: row.foodId,
            nameEn: row.nameEn,
            nameUr: row.nameUr,
            defaultServingSize: row.defaultServingSize,
            defaultServingUnit: row.defaultServingUnit,
            servingWeightGrams: row.servingWeightGrams,
            caloriesPer100g: row.caloriesPer100g,
            proteinPer100g: row.proteinPer100g,
            carbsPer100g: row.carbsPer100g,
            fatPer100g: row.fatPer100g,
            fibrePer100g: row.fibrePer100g,
            image: row.image,
          },
          price: {
            id: row.priceId,
            city: row.city,
            marketRetailer: row.marketRetailer,
            price: row.price,
            quantity: row.quantity,
            unit: row.unit,
            pricePerStandardUnit: row.pricePerStandardUnit,
            standardUnit: row.standardUnit,
            currency: row.currency,
            verificationStatus: row.verificationStatus,
            confidenceLevel: row.confidenceLevel,
            collectionDate: row.collectionDate,
          },
        });
      }
    }

    const ranked = rankProteinCostEfficiency(uniquePairs).map((r) => ({
      ...r,
      foodId: r.food.id,
      foodNameEn: r.food.nameEn,
      foodNameUr: r.food.nameUr,
      city: r.price.city,
      price: r.price.price,
      unit: r.price.unit,
      costPer20gProtein: r.costPer20gProteinPkr,
    }));

    return NextResponse.json(
      {
        city,
        totalItems: ranked.length,
        ranking: ranked,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Compare prices error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while comparing prices." },
      { status: 500 }
    );
  }
}
