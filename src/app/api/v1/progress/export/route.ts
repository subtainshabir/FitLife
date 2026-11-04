import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportProgressDataCsv, getWeightHistory, getBodyMeasurements } from "@/lib/services/progress-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    if (format === "json") {
      const weights = await getWeightHistory(session.user.id);
      const measurements = await getBodyMeasurements(session.user.id);
      return NextResponse.json({ weights, measurements }, { status: 200 });
    }

    const csvData = await exportProgressDataCsv(session.user.id);
    const filename = `fitlife-progress-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/progress/export error:", error);
    return NextResponse.json({ error: error.message || "Failed to export data." }, { status: 500 });
  }
}
