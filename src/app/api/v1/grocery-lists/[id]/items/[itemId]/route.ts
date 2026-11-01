import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groceryLists, groceryListItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateGroceryItemSchema } from "@/lib/validations/nutrition-plan";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, itemId } = await params;
    const [list] = await db
      .select()
      .from(groceryLists)
      .where(and(eq(groceryLists.id, id), eq(groceryLists.userId, session.user.id)))
      .limit(1);

    if (!list) {
      return NextResponse.json({ error: "Grocery list not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateGroceryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const [existingItem] = await db
      .select()
      .from(groceryListItems)
      .where(and(eq(groceryListItems.id, itemId), eq(groceryListItems.groceryListId, id)))
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Grocery item not found." }, { status: 404 });
    }

    let estimatedCostPkr = existingItem.estimatedCostPkr;
    if (parsed.data.totalQuantity !== undefined && parsed.data.totalQuantity !== existingItem.totalQuantity) {
      const unitCost = existingItem.totalQuantity > 0 ? existingItem.estimatedCostPkr / existingItem.totalQuantity : 0;
      estimatedCostPkr = Math.round(unitCost * parsed.data.totalQuantity * 10) / 10;
    }

    const [updatedItem] = await db
      .update(groceryListItems)
      .set({
        ...parsed.data,
        estimatedCostPkr,
        updatedAt: new Date(),
      })
      .where(eq(groceryListItems.id, itemId))
      .returning();

    // Re-sum total estimated cost for the list
    const allItems = await db
      .select()
      .from(groceryListItems)
      .where(eq(groceryListItems.groceryListId, id));

    const totalCost = Math.round(allItems.reduce((sum, i) => sum + i.estimatedCostPkr, 0) * 10) / 10;

    await db
      .update(groceryLists)
      .set({ totalEstimatedCostPkr: totalCost, updatedAt: new Date() })
      .where(eq(groceryLists.id, id));

    return NextResponse.json({ item: updatedItem, totalEstimatedCostPkr: totalCost }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update item" }, { status: 500 });
  }
}

