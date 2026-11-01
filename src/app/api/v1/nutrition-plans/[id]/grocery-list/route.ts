import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { nutritionPlans, groceryLists, groceryListItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    const [plan] = await db
      .select()
      .from(nutritionPlans)
      .where(and(eq(nutritionPlans.id, id), eq(nutritionPlans.userId, session.user.id)))
      .limit(1);

    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const [list] = await db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.nutritionPlanId, plan.id))
      .limit(1);

    if (!list) {
      return NextResponse.json({ error: "Grocery list not found." }, { status: 404 });
    }

    const items = await db
      .select()
      .from(groceryListItems)
      .where(eq(groceryListItems.groceryListId, list.id));

    return NextResponse.json({ groceryList: { ...list, items } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch grocery list" }, { status: 500 });
  }
}

