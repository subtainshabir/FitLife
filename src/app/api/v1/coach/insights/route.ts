import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProactiveCoachInsights } from "@/lib/services/coach-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const insights = await getProactiveCoachInsights(session.user.id);
    return NextResponse.json({ insights }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/coach/insights error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch coach insights." },
      { status: 500 }
    );
  }
}

