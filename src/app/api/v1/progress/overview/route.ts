import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransformationOverview } from "@/lib/services/progress-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const overview = await getTransformationOverview(session.user.id);
    return NextResponse.json(overview, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/overview error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transformation overview." }, { status: 500 });
  }
}

