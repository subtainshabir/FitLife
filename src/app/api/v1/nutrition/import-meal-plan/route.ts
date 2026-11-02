import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importMealPlanSchema } from "@/lib/validations/diary";
import { importPlannedMealsToDiary } from "@/lib/services/diary-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = importMealPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      date,
      nutritionPlanId,
      mealPlanId,
      mealId,
      selectedFoodItemIds,
      confirmConsumed,
    } = parsed.data;

    const result = await importPlannedMealsToDiary({
      userId,
      date,
      nutritionPlanId,
      mealPlanId,
      mealId,
      selectedFoodItemIds,
      confirmConsumed,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.importedCount} planned items (${result.skippedDuplicates} duplicate entries prevented)`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/v1/nutrition/import-meal-plan error:", error);
    return NextResponse.json(
      { error: "Failed to import meal plan items", details: error.message },
      { status: 500 }
    );
  }
}

