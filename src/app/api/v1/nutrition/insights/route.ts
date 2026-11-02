import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateNutritionInsights } from "@/lib/services/diary-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const insights = await calculateNutritionInsights(userId, date);

    return NextResponse.json({
      success: true,
      data: insights,
      date,
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/insights error:", error);
    return NextResponse.json(
      { error: "Failed to compile nutrition insights", details: error.message },
      { status: 500 }
    );
  }
}

