import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { favouriteFoods, foodItems } from "@/db/schema";
import { favouriteFoodSchema } from "@/lib/validations/diary";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const favourites = await db
      .select({
        favourite: favouriteFoods,
        food: foodItems,
      })
      .from(favouriteFoods)
      .innerJoin(foodItems, eq(favouriteFoods.foodItemId, foodItems.id))
      .where(eq(favouriteFoods.userId, userId))
      .orderBy(desc(favouriteFoods.createdAt));

    const formatted = favourites.map((row) => ({
      ...row.favourite,
      food: row.food,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/favourites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favourite foods", details: error.message },
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
    const parsed = favouriteFoodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { foodItemId, customServingSize, customServingUnit, notes } = parsed.data;

    // Check if already favourited
    const [existing] = await db
      .select()
      .from(favouriteFoods)
      .where(
        and(
          eq(favouriteFoods.userId, userId),
          eq(favouriteFoods.foodItemId, foodItemId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "Food is already in your favourites",
          data: existing,
        },
        { status: 200 }
      );
    }

    const [created] = await db
      .insert(favouriteFoods)
      .values({
        userId,
        foodItemId,
        customServingSize: customServingSize || null,
        customServingUnit: customServingUnit || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Added to favourite foods",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/nutrition/favourites error:", error);
    return NextResponse.json(
      { error: "Failed to add favourite food", details: error.message },
      { status: 500 }
    );
  }
}
