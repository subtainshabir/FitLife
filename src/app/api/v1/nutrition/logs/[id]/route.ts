import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { foodLogEntries, foodItems } from "@/db/schema";
import { updateFoodLogEntrySchema } from "@/lib/validations/diary";
import {
  recalculateDailyLogTotals,
  getOrCreateDailyLog,
} from "@/lib/services/diary-service";
import {
  calculateFoodNutrition,
  type FoodNutritionBasics,
} from "@/lib/services/nutrition-calculator";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const identifier = params.id;

    // Check if identifier is a YYYY-MM-DD date
    const isDate = /^\d{4}-\d{2}-\d{2}$/.test(identifier);

    if (isDate) {
      const dailyLog = await getOrCreateDailyLog(userId, identifier);
      const entries = await db
        .select({
          entry: foodLogEntries,
          food: foodItems,
        })
        .from(foodLogEntries)
        .leftJoin(foodItems, eq(foodLogEntries.foodItemId, foodItems.id))
        .where(eq(foodLogEntries.dailyLogId, dailyLog.id))
        .orderBy(desc(foodLogEntries.loggedAt));

      return NextResponse.json({
        success: true,
        data: {
          dailyLog,
          entries: entries.map((r) => ({ ...r.entry, food: r.food })),
        },
      });
    }

    // Otherwise treat as entry UUID
    const [row] = await db
      .select({
        entry: foodLogEntries,
        food: foodItems,
      })
      .from(foodLogEntries)
      .leftJoin(foodItems, eq(foodLogEntries.foodItemId, foodItems.id))
      .where(and(eq(foodLogEntries.id, identifier), eq(foodLogEntries.userId, userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Food log entry not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...row.entry,
        food: row.food,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/logs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch food log", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const entryId = params.id;

    // Find existing entry
    const [existing] = await db
      .select()
      .from(foodLogEntries)
      .where(and(eq(foodLogEntries.id, entryId), eq(foodLogEntries.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Food log entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateFoodLogEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { quantity, unit, mealCategory } = parsed.data;

    let newQuantity = quantity ?? existing.quantity;
    let newUnit = unit ?? existing.unit;
    let newWeightGrams = existing.weightGrams;
    let newCalories = existing.calories;
    let newProtein = existing.proteinGrams;
    let newCarbs = existing.carbsGrams;
    let newFat = existing.fatGrams;
    let newFibre = existing.fibreGrams;

    // If quantity or unit changed and foodItemId exists, recalculate nutrition snapshot
    if ((quantity !== undefined || unit !== undefined) && existing.foodItemId) {
      const [food] = await db
        .select()
        .from(foodItems)
        .where(eq(foodItems.id, existing.foodItemId))
        .limit(1);

      if (food) {
        const basicFood: FoodNutritionBasics = {
          id: food.id,
          nameEn: food.nameEn,
          nameUr: food.nameUr,
          defaultServingSize: food.defaultServingSize,
          defaultServingUnit: food.defaultServingUnit,
          servingWeightGrams: food.servingWeightGrams,
          caloriesPer100g: food.caloriesPer100g,
          proteinPer100g: food.proteinPer100g,
          carbsPer100g: food.carbsPer100g,
          fatPer100g: food.fatPer100g,
          fibrePer100g: food.fibrePer100g,
        };

        const calc = calculateFoodNutrition(basicFood, newQuantity, newUnit);
        newWeightGrams = calc.weightGrams;
        newCalories = calc.calories;
        newProtein = calc.protein;
        newCarbs = calc.carbs;
        newFat = calc.fat;
        newFibre = calc.fibre;
      }
    } else if (quantity !== undefined && !existing.foodItemId) {
      // Linear scaling if custom item
      const ratio = newQuantity / existing.quantity;
      newCalories = Math.round(existing.calories * ratio * 10) / 10;
      newProtein = Math.round(existing.proteinGrams * ratio * 10) / 10;
      newCarbs = Math.round(existing.carbsGrams * ratio * 10) / 10;
      newFat = Math.round(existing.fatGrams * ratio * 10) / 10;
      newFibre = Math.round(existing.fibreGrams * ratio * 10) / 10;
      newWeightGrams = Math.round(existing.weightGrams * ratio * 10) / 10;
    }

    const [updated] = await db
      .update(foodLogEntries)
      .set({
        quantity: newQuantity,
        unit: newUnit,
        mealCategory: mealCategory ?? existing.mealCategory,
        weightGrams: newWeightGrams,
        calories: newCalories,
        proteinGrams: newProtein,
        carbsGrams: newCarbs,
        fatGrams: newFat,
        fibreGrams: newFibre,
        updatedAt: new Date(),
      })
      .where(eq(foodLogEntries.id, entryId))
      .returning();

    // Recalculate daily totals
    const updatedDailyLog = await recalculateDailyLogTotals(existing.dailyLogId);

    return NextResponse.json({
      success: true,
      message: "Food log updated successfully",
      data: {
        entry: updated,
        dailyLog: updatedDailyLog,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/v1/nutrition/logs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update food log", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const entryId = params.id;

    const [existing] = await db
      .select()
      .from(foodLogEntries)
      .where(and(eq(foodLogEntries.id, entryId), eq(foodLogEntries.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Food log entry not found" }, { status: 404 });
    }

    const dailyLogId = existing.dailyLogId;
    await db.delete(foodLogEntries).where(eq(foodLogEntries.id, entryId));

    // Recalculate daily totals
    const updatedDailyLog = await recalculateDailyLogTotals(dailyLogId);

    return NextResponse.json({
      success: true,
      message: "Food entry removed",
      data: {
        dailyLog: updatedDailyLog,
      },
    });
  } catch (error: any) {
    console.error("DELETE /api/v1/nutrition/logs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete food log", details: error.message },
      { status: 500 }
    );
  }
}
