import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBodyMeasurements, logBodyMeasurement } from "@/lib/services/progress-service";
import { bodyMeasurementSchema } from "@/lib/validations/progress";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const data = await getBodyMeasurements(session.user.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/measurements error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch body measurements." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bodyMeasurementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const saved = await logBodyMeasurement(session.user.id, parsed.data);
    return NextResponse.json({ message: "Body measurement recorded successfully.", entry: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/progress/measurements error:", error);
    return NextResponse.json({ error: error.message || "Failed to record body measurement." }, { status: 500 });
  }
}
