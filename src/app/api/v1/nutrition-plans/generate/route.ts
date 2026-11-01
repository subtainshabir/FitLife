import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateNutritionPlanSchema } from "@/lib/validations/nutrition-plan";
import { generateAndSaveNutritionPlan } from "@/lib/services/plan-generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to generate a nutrition plan." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = generateNutritionPlanSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const result = await generateAndSaveNutritionPlan(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        message: "Nutrition plan successfully generated.",
        plan: result.plan,
        mealPlans: result.mealPlans,
        groceryList: result.groceryList,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Nutrition Plan Generate Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate nutrition plan." },
      { status: 500 }
    );
  }
}

