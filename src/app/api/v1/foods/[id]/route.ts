import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, foodCategories, foodPrices, priceSources, foodTranslations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const [food] = await db
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
        isCommonPakistaniFood: foodItems.isCommonPakistaniFood,
        createdAt: foodItems.createdAt,
        updatedAt: foodItems.updatedAt,
        categorySlug: foodCategories.slug,
        categoryNameEn: foodCategories.nameEn,
        categoryNameUr: foodCategories.nameUr,
        categoryIcon: foodCategories.icon,
      })
      .from(foodItems)
      .innerJoin(foodCategories, eq(foodItems.categoryId, foodCategories.id))
      .where(eq(foodItems.id, id))
      .limit(1);

    if (!food) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    // Fetch translations
    const translations = await db
      .select()
      .from(foodTranslations)
      .where(eq(foodTranslations.foodId, id));

    // Fetch all prices across Pakistani cities with price sources
    const prices = await db
      .select({
        id: foodPrices.id,
        foodId: foodPrices.foodId,
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
      .leftJoin(priceSources, eq(foodPrices.sourceId, priceSources.id))
      .where(eq(foodPrices.foodId, id))
      .orderBy(desc(foodPrices.collectionDate));

    return NextResponse.json(
      {
        food,
        translations,
        prices,
        hasPriceData: prices.length > 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get food detail error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving food detail." },
      { status: 500 }
    );
  }
}

