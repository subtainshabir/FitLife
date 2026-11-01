import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { foodPrices, foodItems } from "@/db/schema";
import { createFoodPriceSchema } from "@/lib/validations/food";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, user } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = createFoodPriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify food exists
    const [food] = await db
      .select({ id: foodItems.id })
      .from(foodItems)
      .where(eq(foodItems.id, data.foodId))
      .limit(1);

    if (!food) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    // Calculate pricePerStandardUnit (e.g. Price per kg or per dozen)
    let pricePerStandardUnit = data.price / data.quantity;
    if (data.unit === "g") {
      pricePerStandardUnit = (data.price / data.quantity) * 1000;
    }

    const now = new Date();

    const [createdPrice] = await db
      .insert(foodPrices)
      .values({
        foodId: data.foodId,
        country: data.country,
        province: data.province,
        city: data.city,
        marketRetailer: data.marketRetailer,
        price: data.price,
        quantity: data.quantity,
        unit: data.unit,
        pricePerStandardUnit: Math.round(pricePerStandardUnit * 100) / 100,
        standardUnit: data.standardUnit || "kg",
        currency: data.currency || "PKR",
        sourceId: data.sourceId || null,
        verificationStatus: data.verificationStatus,
        confidenceLevel: data.confidenceLevel,
        submittedByUserId: user?.id || null,
        notes: data.notes || null,
        collectionDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(
      { message: "Food price record created successfully.", price: createdPrice },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create price error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating price record." },
      { status: 500 }
    );
  }
}

