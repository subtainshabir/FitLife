import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPhotoFile } from "@/lib/services/progress-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const { buffer, mimeType } = await getPhotoFile(session.user.id, id);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=86400",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error(`GET /api/v1/progress/photos/${params.id}/file error:`, error);
    return NextResponse.json({ error: error.message || "Failed to load photo." }, { status: 404 });
  }
}

