import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateProgressReport } from "@/lib/services/progress-service";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { saveReportSchema } from "@/lib/validations/progress";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period") || "30_days";
    const period = ["7_days", "30_days", "90_days", "custom"].includes(periodParam)
      ? (periodParam as "7_days" | "30_days" | "90_days" | "custom")
      : "30_days";

    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    const customStart = startParam ? new Date(startParam) : undefined;
    const customEnd = endParam ? new Date(endParam) : undefined;

    const report = await generateProgressReport(session.user.id, period, customStart, customEnd);
    return NextResponse.json({ report }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/v1/progress/reports error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = saveReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const [saved] = await db
      .insert(schema.progressReports)
      .values({
        userId: session.user.id,
        periodType: parsed.data.periodType,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        metrics: parsed.data.metrics,
      })
      .returning();

    return NextResponse.json({ message: "Progress report snapshot saved.", report: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v1/progress/reports error:", error);
    return NextResponse.json({ error: error.message || "Failed to save report snapshot." }, { status: 500 });
  }
}

