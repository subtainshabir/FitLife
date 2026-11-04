import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransformationPhotos, saveTransformationPhoto } from "@/lib/services/progress-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const photos = await getTransformationPhotos(session.user.id);
    return NextResponse.json({ photos }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/photos error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transformation photos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB size limit." }, { status: 400 });
    }

    // Validate mime
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file format. Please upload JPEG, PNG, or WebP images." }, { status: 400 });
    }

    const viewAngleRaw = (formData.get("viewAngle") as string) || "front";
    const viewAngle = ["front", "side", "back", "other"].includes(viewAngleRaw)
      ? (viewAngleRaw as "front" | "side" | "back" | "other")
      : "front";

    const photoDate = (formData.get("photoDate") as string) || new Date().toISOString();
    const weightRaw = formData.get("weightKg");
    const weightKg = weightRaw ? parseFloat(weightRaw as string) : undefined;
    const isHidden = formData.get("isHidden") === "true";
    const notes = (formData.get("notes") as string) || undefined;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const saved = await saveTransformationPhoto(
      session.user.id,
      {
        buffer,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
      {
        viewAngle,
        photoDate,
        weightKg,
        isHidden,
        notes,
      }
    );

    return NextResponse.json({ message: "Progress photo uploaded securely.", photo: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/progress/photos error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload photo." }, { status: 500 });
  }
}

