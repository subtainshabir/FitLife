import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { db } from "@/db";
import { foodItems } from "@/db/schema";
import { updateFoodItemSchema } from "@/lib/validations/food";
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
    const parsed = updateFoodItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [existing] = await db
      .select({ id: foodItems.id })
      .from(foodItems)
      .where(eq(foodItems.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Food item not found." }, { status: 404 });
    }

    const [updated] = await db
      .update(foodItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(foodItems.id, id))
      .returning();

    return NextResponse.json(
      { message: "Food item updated successfully.", food: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update food error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while updating food item." },
      { status: 500 }
    );
  }
}

