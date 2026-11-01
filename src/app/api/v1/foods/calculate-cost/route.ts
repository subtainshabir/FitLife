import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodItems, foodPrices } from "@/db/schema";
import { calculateCostSchema } from "@/lib/validations/food";
import { calculateFoodCost } from "@/lib/services/nutrition-calculator";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = calculateCostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { foodId, quantity, unit, city, priceId } = parsed.data;

    // Fetch food item
    const [food] = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.id, foodId))
      .limit(1);

    if (!food) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    // Fetch price record
    let priceRecord;
    if (priceId) {
      const [p] = await db.select().from(foodPrices).where(eq(foodPrices.id, priceId)).limit(1);
      priceRecord = p;
    } else {
      // Find latest price for requested city, or fallback to any latest verified price
      const conditions = [eq(foodPrices.foodId, foodId)];
      if (city) {
        conditions.push(eq(foodPrices.city, city));
      }

      const [p] = await db
        .select()
        .from(foodPrices)
        .where(and(...conditions))
        .orderBy(desc(foodPrices.collectionDate))
        .limit(1);

      priceRecord = p;

      // If no price in specific city, check for any verified price in Pakistan
      if (!priceRecord && city) {
        const [fallbackPrice] = await db
          .select()
          .from(foodPrices)
          .where(eq(foodPrices.foodId, foodId))
          .orderBy(desc(foodPrices.collectionDate))
          .limit(1);

        priceRecord = fallbackPrice;
      }
    }

    if (!priceRecord) {
      return NextResponse.json(
        {
          error: "No price data available for this food item in the selected location.",
          hasPrice: false,
        },
        { status: 404 }
      );
    }

    const calculatedCost = calculateFoodCost(food, quantity, unit, priceRecord);

    return NextResponse.json(
      {
        hasPrice: true,
        food: {
          id: food.id,
          nameEn: food.nameEn,
          nameUr: food.nameUr,
        },
        cost: calculatedCost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Calculate cost error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while calculating cost." },
      { status: 500 }
    );
  }
}

