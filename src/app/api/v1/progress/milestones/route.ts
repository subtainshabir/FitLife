import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMilestones, createCustomMilestone } from "@/lib/services/progress-service";
import { customMilestoneSchema } from "@/lib/validations/progress";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const milestones = await getMilestones(session.user.id);
    return NextResponse.json({ milestones }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/milestones error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch milestones." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = customMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const created = await createCustomMilestone(session.user.id, parsed.data);
    return NextResponse.json({ message: "Custom milestone created.", milestone: created }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/progress/milestones error:", error);
    return NextResponse.json({ error: error.message || "Failed to create milestone." }, { status: 500 });
  }
}

