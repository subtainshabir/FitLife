import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bodyMeasurementHistory, userProfiles } from "@/db/schema";
import { weightLogSchema } from "@/lib/validations/measurement";
import { lbsToKg } from "@/lib/services/fitness-calculator";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view weight progress." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Retrieve weight measurement history ordered chronologically
    const history = await db
      .select()
      .from(bodyMeasurementHistory)
      .where(eq(bodyMeasurementHistory.userId, userId))
      .orderBy(desc(bodyMeasurementHistory.recordedAt))
      .limit(100);

    const latest = history[0] || null;
    const oldest = history[history.length - 1] || null;

    let netChangeKg = 0;
    if (latest && oldest && history.length > 1) {
      netChangeKg = Math.round((latest.weight - oldest.weight) * 10) / 10;
    }

    return NextResponse.json(
      {
        history,
        latestWeight: latest ? latest.weight : null,
        totalEntries: history.length,
        netChangeKg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get weight progress error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to log weight." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = weightLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const userId = session.user.id;

    let weightKg = data.weight;
    if (data.unit === "lbs") {
      weightKg = lbsToKg(data.weight);
    }

    const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date();
    const now = new Date();

    const [savedEntry] = await db
      .insert(bodyMeasurementHistory)
      .values({
        userId,
        weight: weightKg,
        height: data.height || null,
        unit: data.unit,
        source: "manual",
        notes: data.notes || null,
        recordedAt,
        createdAt: now,
      })
      .returning();

    // If requested, update currentWeight on userProfiles
    if (data.updateProfileCurrentWeight) {
      await db
        .update(userProfiles)
        .set({
          currentWeight: weightKg,
          updatedAt: now,
        })
        .where(eq(userProfiles.userId, userId));
    }

    return NextResponse.json(
      {
        message: "Weight measurement logged successfully.",
        entry: savedEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Log weight error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while logging weight." },
      { status: 500 }
    );
  }
}

