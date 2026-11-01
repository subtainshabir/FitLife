import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { foodPrices } from "@/db/schema";
import { updateFoodPriceSchema } from "@/lib/validations/food";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { errorResponse } = await verifyAdmin();
    if (errorResponse) return errorResponse;

    const { id } = params;
    const body = await req.json();
    const parsed = updateFoodPriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [existing] = await db
      .select({ id: foodPrices.id })
      .from(foodPrices)
      .where(eq(foodPrices.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Price record not found." }, { status: 404 });
    }

    const [updated] = await db
      .update(foodPrices)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(foodPrices.id, id))
      .returning();

    return NextResponse.json(
      { message: "Price record updated successfully.", price: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update price error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while updating price record." },
      { status: 500 }
    );
  }
}

