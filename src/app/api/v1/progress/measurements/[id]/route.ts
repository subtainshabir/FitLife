import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateBodyMeasurement, deleteBodyMeasurement } from "@/lib/services/progress-service";
import { updateBodyMeasurementSchema } from "@/lib/validations/progress";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = updateBodyMeasurementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const updated = await updateBodyMeasurement(session.user.id, id, parsed.data);
    return NextResponse.json({ message: "Body measurement updated successfully.", entry: updated }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/v1/progress/measurements/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to update body measurement." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const deleted = await deleteBodyMeasurement(session.user.id, id);
    return NextResponse.json({ message: "Body measurement deleted successfully.", entry: deleted }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/v1/progress/measurements/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to delete body measurement." }, { status: 500 });
  }
}

