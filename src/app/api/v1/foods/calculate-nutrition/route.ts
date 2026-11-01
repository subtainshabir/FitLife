import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems } from "@/db/schema";
import { calculateNutritionSchema } from "@/lib/validations/food";
import { calculateFoodNutrition } from "@/lib/services/nutrition-calculator";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if single or batch
    if (Array.isArray(body.foods)) {
      if (body.foods.length === 0) {
        return NextResponse.json(
          { error: "At least one food item must be provided in the foods list." },
          { status: 400 }
        );
      }

      const foodIds = body.foods.map((f: any) => f.foodId).filter(Boolean);
      const items = await db
        .select()
        .from(foodItems)
        .where(inArray(foodItems.id, foodIds));

      const foodMap = new Map(items.map((i) => [i.id, i]));

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFibre = 0;
      let totalWeightGrams = 0;

      const breakdown = [];

      for (const reqItem of body.foods) {
        const parsed = calculateNutritionSchema.safeParse(reqItem);
        if (!parsed.success) continue;

        const food = foodMap.get(parsed.data.foodId);
        if (!food) continue;

        const result = calculateFoodNutrition(food, parsed.data.quantity, parsed.data.unit);
        totalCalories += result.calories;
        totalProtein += result.protein;
        totalCarbs += result.carbs;
        totalFat += result.fat;
        totalFibre += result.fibre;
        totalWeightGrams += result.weightGrams;

        breakdown.push({
          food: {
            id: food.id,
            nameEn: food.nameEn,
            nameUr: food.nameUr,
          },
          ...result,
        });
      }

      return NextResponse.json(
        {
          totalItems: breakdown.length,
          totals: {
            weightGrams: Math.round(totalWeightGrams * 10) / 10,
            calories: Math.round(totalCalories * 10) / 10,
            protein: Math.round(totalProtein * 10) / 10,
            carbs: Math.round(totalCarbs * 10) / 10,
            fat: Math.round(totalFat * 10) / 10,
            fibre: Math.round(totalFibre * 10) / 10,
          },
          items: breakdown,
        },
        { status: 200 }
      );
    }

    // Single item calculation
    const parsed = calculateNutritionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { foodId, quantity, unit } = parsed.data;

    const [food] = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.id, foodId))
      .limit(1);

    if (!food) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    const calculated = calculateFoodNutrition(food, quantity, unit);

    return NextResponse.json(
      {
        food: {
          id: food.id,
          nameEn: food.nameEn,
          nameUr: food.nameUr,
          image: food.image,
        },
        nutrition: calculated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Calculate nutrition error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while calculating nutrition." },
      { status: 500 }
    );
  }
}
