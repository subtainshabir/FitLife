import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateWeightEntry, deleteWeightEntry } from "@/lib/services/progress-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateWeightSchema = z.object({
  weight: z.number().positive().max(500).optional(),
  unit: z.enum(["kg", "lbs"]).optional(),
  notes: z.string().max(500).optional().nullable(),
  recordedAt: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const parsed = updateWeightSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const updated = await updateWeightEntry(session.user.id, id, parsed.data);
    return NextResponse.json({ message: "Weight entry updated successfully.", entry: updated }, { status: 200 });
  } catch (error: any) {
    console.error(`PATCH /api/v1/progress/weight/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to update weight entry." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { id } = params;
    const deleted = await deleteWeightEntry(session.user.id, id);
    return NextResponse.json({ message: "Weight entry deleted successfully.", entry: deleted }, { status: 200 });
  } catch (error: any) {
    console.error(`DELETE /api/v1/progress/weight/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to delete weight entry." }, { status: 500 });
  }
}

