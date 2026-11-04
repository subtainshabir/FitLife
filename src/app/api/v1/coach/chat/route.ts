import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendMessageToCoach } from "@/lib/services/coach-service";
import { coachChatSchema } from "@/lib/validations/coach";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = coachChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await sendMessageToCoach(session.user.id, parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/v1/coach/chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message." },
      { status: 500 }
    );
  }
}

