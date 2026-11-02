import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { foodLogEntries, foodItems } from "@/db/schema";
import { createFoodLogEntrySchema } from "@/lib/validations/diary";
import { logFoodItem, getOrCreateDailyLog } from "@/lib/services/diary-service";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const dailyLog = await getOrCreateDailyLog(userId, date);

    const entries = await db
      .select({
        entry: foodLogEntries,
        food: foodItems,
      })
      .from(foodLogEntries)
      .leftJoin(foodItems, eq(foodLogEntries.foodItemId, foodItems.id))
      .where(eq(foodLogEntries.dailyLogId, dailyLog.id))
      .orderBy(desc(foodLogEntries.loggedAt));

    const formatted = entries.map((row) => ({
      ...row.entry,
      food: row.food,
    }));

    return NextResponse.json({
      success: true,
      data: {
        dailyLog,
        entries: formatted,
        totalEntries: formatted.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch food logs", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createFoodLogEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      logDate,
      foodItemId,
      mealCategory,
      foodNameEn,
      foodNameUr,
      quantity,
      unit,
      weightGrams,
      plannedMealFoodItemId,
      isFromMealPlan,
      idempotencyKey,
    } = parsed.data;

    const result = await logFoodItem({
      userId,
      logDate,
      foodItemId,
      mealCategory,
      foodNameEn,
      foodNameUr,
      quantity,
      unit,
      weightGrams,
      plannedMealFoodItemId,
      isFromMealPlan,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.isDuplicateSkipped
          ? "Item already logged (duplicate import skipped)"
          : "Food item logged successfully",
        data: result,
      },
      { status: result.isDuplicateSkipped ? 200 : 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/nutrition/logs error:", error);
    return NextResponse.json(
      { error: "Failed to log food item", details: error.message },
      { status: 500 }
    );
  }
}
