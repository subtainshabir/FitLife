import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyCoachRecommendation } from "@/lib/services/coach-service";
import { applyRecommendationSchema } from "@/lib/validations/coach";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = applyRecommendationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await applyCoachRecommendation(session.user.id, id);
    return NextResponse.json(
      { message: "Recommendation applied successfully.", recommendation: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`POST /api/v1/coach/recommendations/${params.id}/apply error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to apply recommendation." },
      { status: 500 }
    );
  }
}
