import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuickFoods } from "@/lib/services/diary-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const quickFoods = await getQuickFoods(userId);

    return NextResponse.json({
      success: true,
      data: quickFoods,
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/quick-foods error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quick foods", details: error.message },
      { status: 500 }
    );
  }
}
