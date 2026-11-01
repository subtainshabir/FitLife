import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { foodItems, foodTranslations } from "@/db/schema";
import { createFoodItemSchema } from "@/lib/validations/food";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = createFoodItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date();

    const [created] = await db
      .insert(foodItems)
      .values({
        categoryId: data.categoryId,
        nameEn: data.nameEn,
        nameUr: data.nameUr,
        descriptionEn: data.descriptionEn,
        descriptionUr: data.descriptionUr,
        foodType: data.foodType,
        defaultServingSize: data.defaultServingSize,
        defaultServingUnit: data.defaultServingUnit,
        servingWeightGrams: data.servingWeightGrams,
        caloriesPer100g: data.caloriesPer100g,
        proteinPer100g: data.proteinPer100g,
        carbsPer100g: data.carbsPer100g,
        fatPer100g: data.fatPer100g,
        fibrePer100g: data.fibrePer100g,
        nutritionSource: data.nutritionSource,
        image: data.image || null,
        isCommonPakistaniFood: data.isCommonPakistaniFood,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Add translation records
    await db.insert(foodTranslations).values([
      {
        foodId: created.id,
        language: "en",
        name: data.nameEn,
        description: data.descriptionEn,
        servingUnitName: data.defaultServingUnit,
      },
      {
        foodId: created.id,
        language: "ur",
        name: data.nameUr,
        description: data.descriptionUr,
        servingUnitName: data.defaultServingUnit,
      },
    ]);

    return NextResponse.json(
      { message: "Food item created successfully.", food: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create food error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating food item." },
      { status: 500 }
    );
  }
}

