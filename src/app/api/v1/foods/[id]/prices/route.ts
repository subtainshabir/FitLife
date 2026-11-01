import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { foodPrices, priceSources, foodItems } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.trim();

    // Verify food exists
    const [food] = await db
      .select({ id: foodItems.id, nameEn: foodItems.nameEn, nameUr: foodItems.nameUr })
      .from(foodItems)
      .where(eq(foodItems.id, id))
      .limit(1);

    if (!food) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    const conditions = [eq(foodPrices.foodId, id)];
    if (city) {
      conditions.push(eq(foodPrices.city, city));
    }

    const prices = await db
      .select({
        id: foodPrices.id,
        foodId: foodPrices.foodId,
        country: foodPrices.country,
        province: foodPrices.province,
        city: foodPrices.city,
        marketRetailer: foodPrices.marketRetailer,
        price: foodPrices.price,
        quantity: foodPrices.quantity,
        unit: foodPrices.unit,
        pricePerStandardUnit: foodPrices.pricePerStandardUnit,
        standardUnit: foodPrices.standardUnit,
        currency: foodPrices.currency,
        collectionDate: foodPrices.collectionDate,
        verificationStatus: foodPrices.verificationStatus,
        confidenceLevel: foodPrices.confidenceLevel,
        notes: foodPrices.notes,
        sourceName: priceSources.name,
        sourceType: priceSources.sourceType,
      })
      .from(foodPrices)
      .leftJoin(priceSources, eq(foodPrices.sourceId, priceSources.id))
      .where(and(...conditions))
      .orderBy(desc(foodPrices.collectionDate));

    return NextResponse.json(
      {
        food,
        cityFilter: city || null,
        prices,
        totalRecords: prices.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get food prices error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving food prices." },
      { status: 500 }
    );
  }
}

