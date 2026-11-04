import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteTransformationPhoto } from "@/lib/services/progress-service";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const deleted = await deleteTransformationPhoto(session.user.id, id);
    return NextResponse.json({ message: "Photo deleted successfully.", deleted }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/v1/progress/photos/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to delete photo." }, { status: 500 });
  }
}
