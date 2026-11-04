import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProgressAnalytics } from "@/lib/services/progress-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframeParam = searchParams.get("timeframe") || "30d";
    const timeframe = ["7d", "30d", "90d", "1y", "all"].includes(timeframeParam)
      ? (timeframeParam as "7d" | "30d" | "90d" | "1y" | "all")
      : "30d";

    const analytics = await getProgressAnalytics(session.user.id, timeframe);
    return NextResponse.json(analytics, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/analytics error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch progress analytics." }, { status: 500 });
  }
}
