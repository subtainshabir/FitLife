import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { dailyFoodLogs, waterIntakeEntries } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") || "14", 10)));

    // Calculate start date
    const endDate = new Date().toISOString().slice(0, 10);
    const startDateObj = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const startDate = startDateObj.toISOString().slice(0, 10);

    // Fetch daily logs
    const logs = await db
      .select()
      .from(dailyFoodLogs)
      .where(
        and(
          eq(dailyFoodLogs.userId, userId),
          gte(dailyFoodLogs.logDate, startDate),
          lte(dailyFoodLogs.logDate, endDate)
        )
      )
      .orderBy(desc(dailyFoodLogs.logDate));

    // Fetch water entries in date range
    const waterEntries = await db
      .select()
      .from(waterIntakeEntries)
      .where(
        and(
          eq(waterIntakeEntries.userId, userId),
          gte(waterIntakeEntries.logDate, startDate),
          lte(waterIntakeEntries.logDate, endDate)
        )
      );

    // Group water by date
    const waterByDate: Record<string, number> = {};
    for (const w of waterEntries) {
      waterByDate[w.logDate] = (waterByDate[w.logDate] || 0) + w.amountMl;
    }

    // Combine history points
    const historyPoints = logs.map((l) => ({
      date: l.logDate,
      totalCalories: Math.round(l.totalCalories),
      targetCalories: Math.round(l.targetCalories),
      totalProteinGrams: Math.round(l.totalProteinGrams * 10) / 10,
      targetProteinGrams: Math.round(l.targetProteinGrams),
      totalCarbsGrams: Math.round(l.totalCarbsGrams * 10) / 10,
      targetCarbsGrams: Math.round(l.targetCarbsGrams),
      totalFatGrams: Math.round(l.totalFatGrams * 10) / 10,
      targetFatGrams: Math.round(l.targetFatGrams),
      totalFibreGrams: Math.round(l.totalFibreGrams * 10) / 10,
      waterTotalMl: waterByDate[l.logDate] || 0,
      waterTotalLitres: Math.round(((waterByDate[l.logDate] || 0) / 1000) * 10) / 10,
    }));

    // Calculate averages across days with logged data
    const activeDays = historyPoints.filter((p) => p.totalCalories > 0);
    const avgCalories =
      activeDays.length > 0
        ? Math.round(activeDays.reduce((sum, p) => sum + p.totalCalories, 0) / activeDays.length)
        : 0;

    const avgProtein =
      activeDays.length > 0
        ? Math.round((activeDays.reduce((sum, p) => sum + p.totalProteinGrams, 0) / activeDays.length) * 10) / 10
        : 0;

    const avgCarbs =
      activeDays.length > 0
        ? Math.round((activeDays.reduce((sum, p) => sum + p.totalCarbsGrams, 0) / activeDays.length) * 10) / 10
        : 0;

    const avgFat =
      activeDays.length > 0
        ? Math.round((activeDays.reduce((sum, p) => sum + p.totalFatGrams, 0) / activeDays.length) * 10) / 10
        : 0;

    const avgWaterMl =
      activeDays.length > 0
        ? Math.round(activeDays.reduce((sum, p) => sum + p.waterTotalMl, 0) / activeDays.length)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        history: historyPoints,
        daysRequested: days,
        activeLoggedDays: activeDays.length,
        loggingConsistencyPercent: Math.round((activeDays.length / days) * 100),
        averages: {
          calories: avgCalories,
          protein: avgProtein,
          carbs: avgCarbs,
          fat: avgFat,
          waterMl: avgWaterMl,
          waterLitres: Math.round((avgWaterMl / 1000) * 10) / 10,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nutrition history", details: error.message },
      { status: 500 }
    );
  }
}

