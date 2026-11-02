import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDailySummary } from "@/lib/services/diary-service";

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

    const summary = await getDailySummary(userId, date);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/daily-summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily summary", details: error.message },
      { status: 500 }
    );
  }
}

