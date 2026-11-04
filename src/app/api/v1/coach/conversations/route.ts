import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUserConversations } from "@/lib/services/coach-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const conversations = await listUserConversations(session.user.id);
    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/coach/conversations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations." },
      { status: 500 }
    );
  }
}

