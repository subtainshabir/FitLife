import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeightHistory, logWeightEntry } from "@/lib/services/progress-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const weightInputSchema = z.object({
  weight: z.number().positive().max(500, "Weight exceeds safe limits"),
  unit: z.enum(["kg", "lbs"]).default("kg"),
  notes: z.string().max(500).optional().nullable(),
  recordedAt: z.string().optional(),
  updateProfileCurrentWeight: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const data = await getWeightHistory(session.user.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/weight error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch weight history." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = weightInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const saved = await logWeightEntry(session.user.id, {
      weight: parsed.data.weight,
      unit: parsed.data.unit,
      notes: parsed.data.notes,
      recordedAt: parsed.data.recordedAt,
      updateProfileCurrentWeight: parsed.data.updateProfileCurrentWeight,
      source: "manual",
    });

    return NextResponse.json({ message: "Weight logged successfully.", entry: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/progress/weight error:", error);
    return NextResponse.json({ error: error.message || "Failed to log weight." }, { status: 500 });
  }
}
