import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { foodPrices, foodItems, priceSources } from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const pendingPrices = await db
      .select({
        id: foodPrices.id,
        foodId: foodPrices.foodId,
        foodNameEn: foodItems.nameEn,
        foodNameUr: foodItems.nameUr,
        city: foodPrices.city,
        province: foodPrices.province,
        marketRetailer: foodPrices.marketRetailer,
        price: foodPrices.price,
        quantity: foodPrices.quantity,
        unit: foodPrices.unit,
        pricePerStandardUnit: foodPrices.pricePerStandardUnit,
        standardUnit: foodPrices.standardUnit,
        currency: foodPrices.currency,
        verificationStatus: foodPrices.verificationStatus,
        confidenceLevel: foodPrices.confidenceLevel,
        collectionDate: foodPrices.collectionDate,
        notes: foodPrices.notes,
        sourceName: priceSources.name,
      })
      .from(foodPrices)
      .innerJoin(foodItems, eq(foodPrices.foodId, foodItems.id))
      .leftJoin(priceSources, eq(foodPrices.sourceId, priceSources.id))
      .where(
        or(
          eq(foodPrices.verificationStatus, "unverified"),
          eq(foodPrices.verificationStatus, "under_review")
        )
      )
      .orderBy(desc(foodPrices.collectionDate));

    return NextResponse.json(
      {
        totalPending: pendingPrices.length,
        prices: pendingPrices,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin pending prices error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving pending prices." },
      { status: 500 }
    );
  }
}

