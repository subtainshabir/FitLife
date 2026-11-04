import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getConversationWithMessages,
  renameConversation,
  deleteConversation,
} from "@/lib/services/coach-service";
import { updateConversationSchema } from "@/lib/validations/coach";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const data = await getConversationWithMessages(session.user.id, id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error(`GET /api/v1/coach/conversations/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversation." },
      { status: 404 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = updateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await renameConversation(session.user.id, id, parsed.data.title);
    return NextResponse.json({ message: "Conversation renamed successfully.", conversation: updated }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/v1/coach/conversations/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to rename conversation." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const deleted = await deleteConversation(session.user.id, id);
    return NextResponse.json({ message: "Conversation deleted successfully.", conversation: deleted }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/v1/coach/conversations/${params.id} error:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete conversation." },
      { status: 500 }
    );
  }
}

