import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { personalRecords, exercises } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const prRows = await db
      .select({
        record: personalRecords,
        exercise: exercises,
      })
      .from(personalRecords)
      .innerJoin(exercises, eq(personalRecords.exerciseId, exercises.id))
      .where(eq(personalRecords.userId, userId))
      .orderBy(desc(personalRecords.achievedAt));

    // Group PRs by exercise
    const exerciseMap = new Map<string, any>();

    for (const row of prRows) {
      const exId = row.exercise.id;
      if (!exerciseMap.has(exId)) {
        exerciseMap.set(exId, {
          exerciseId: exId,
          exerciseNameEn: row.exercise.nameEn,
          exerciseNameUr: row.exercise.nameUr,
          primaryMuscle: row.exercise.primaryMuscle,
          records: [],
        });
      }

      const exEntry = exerciseMap.get(exId);
      let metricDisplay = `${row.record.value}`;
      if (row.record.recordType === "max_weight") metricDisplay = `${row.record.value} kg`;
      if (row.record.recordType === "max_reps") metricDisplay = `${row.record.value} reps`;
      if (row.record.recordType === "max_volume") metricDisplay = `${row.record.value} kg vol`;
      if (row.record.recordType === "max_duration") metricDisplay = `${row.record.value}s hold`;

      exEntry.records.push({
        id: row.record.id,
        recordType: row.record.recordType,
        value: row.record.value,
        previousValue: row.record.previousValue,
        metricDisplay,
        achievedAt: row.record.achievedAt,
      });
    }

    return NextResponse.json({
      success: true,
      data: Array.from(exerciseMap.values()),
      totalRecords: prRows.length,
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/personal-records error:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal records", details: error.message },
      { status: 500 }
    );
  }
}

