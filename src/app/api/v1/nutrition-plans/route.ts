import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { nutritionPlans } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view nutrition plans." },
        { status: 401 }
      );
    }

    const plans = await db
      .select()
      .from(nutritionPlans)
      .where(eq(nutritionPlans.userId, session.user.id))
      .orderBy(desc(nutritionPlans.createdAt));

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error: any) {
    console.error("[Get Nutrition Plans Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch nutrition plans." },
      { status: 500 }
    );
  }
}

