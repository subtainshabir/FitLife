import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { nutritionPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { substituteFoodSchema } from "@/lib/validations/nutrition-plan";
import { substituteMealFood } from "@/lib/services/substitution-service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const [plan] = await db
      .select()
      .from(nutritionPlans)
      .where(and(eq(nutritionPlans.id, id), eq(nutritionPlans.userId, session.user.id)))
      .limit(1);

    if (!plan) {
      return NextResponse.json({ error: "Plan not found or unauthorized." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = substituteFoodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const result = await substituteMealFood(
      parsed.data.mealId,
      parsed.data.mealFoodItemId,
      parsed.data.strategy,
      parsed.data.substituteFoodItemId
    );

    return NextResponse.json(
      {
        message: "Food item successfully substituted.",
        updatedMeal: result.updatedMeal,
        updatedPlan: result.updatedPlan,
        substitutionRecord: result.substitutionRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Substitute Food Error]:", error);
    return NextResponse.json({ error: error?.message || "Failed to substitute food" }, { status: 500 });
  }
}

