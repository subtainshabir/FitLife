import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { nutritionPlans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getFullNutritionPlan } from "@/lib/services/plan-generator";
import { updateNutritionPlanSchema } from "@/lib/validations/nutrition-plan";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const planData = await getFullNutritionPlan(id, session.user.id);

    if (!planData) {
      return NextResponse.json({ error: "Nutrition plan not found." }, { status: 404 });
    }

    return NextResponse.json(planData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateNutritionPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(nutritionPlans)
      .where(and(eq(nutritionPlans.id, id), eq(nutritionPlans.userId, session.user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const [updated] = await db
      .update(nutritionPlans)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(nutritionPlans.id, id))
      .returning();

    return NextResponse.json({ plan: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const [existing] = await db
      .select()
      .from(nutritionPlans)
      .where(and(eq(nutritionPlans.id, id), eq(nutritionPlans.userId, session.user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    await db.delete(nutritionPlans).where(eq(nutritionPlans.id, id));

    return NextResponse.json({ message: "Nutrition plan successfully deleted." }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete plan" }, { status: 500 });
  }
}

