import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { waterIntakeEntries, userWaterGoals } from "@/db/schema";
import { logWaterSchema, updateWaterGoalSchema } from "@/lib/validations/diary";
import { logWater, getDailyWaterTotal } from "@/lib/services/diary-service";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const entries = await db
      .select()
      .from(waterIntakeEntries)
      .where(
        and(
          eq(waterIntakeEntries.userId, userId),
          eq(waterIntakeEntries.logDate, date)
        )
      )
      .orderBy(desc(waterIntakeEntries.loggedAt));

    const totalMl = entries.reduce((sum, e) => sum + e.amountMl, 0);

    // Fetch user water goal
    const [goalRecord] = await db
      .select()
      .from(userWaterGoals)
      .where(eq(userWaterGoals.userId, userId))
      .limit(1);

    const dailyTargetMl = goalRecord ? goalRecord.dailyTargetMl : 2500;
    const containerSizeMl = goalRecord ? goalRecord.containerSizeMl : 250;
    const percentage = Math.min(200, Math.round((totalMl / dailyTargetMl) * 100));

    return NextResponse.json({
      success: true,
      data: {
        date,
        totalMl,
        totalLitres: Math.round((totalMl / 1000) * 10) / 10,
        dailyTargetMl,
        dailyTargetLitres: Math.round((dailyTargetMl / 1000) * 10) / 10,
        containerSizeMl,
        percentage,
        entries,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/nutrition/water error:", error);
    return NextResponse.json(
      { error: "Failed to fetch water data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();

    // Check if updating water goal
    if (body.dailyTargetMl !== undefined && body.amountMl === undefined) {
      const parsedGoal = updateWaterGoalSchema.safeParse(body);
      if (!parsedGoal.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsedGoal.error.format() },
          { status: 400 }
        );
      }

      const [existingGoal] = await db
        .select()
        .from(userWaterGoals)
        .where(eq(userWaterGoals.userId, userId))
        .limit(1);

      let saved;
      if (existingGoal) {
        const [updated] = await db
          .update(userWaterGoals)
          .set({
            dailyTargetMl: parsedGoal.data.dailyTargetMl,
            containerSizeMl: parsedGoal.data.containerSizeMl || existingGoal.containerSizeMl,
            updatedAt: new Date(),
          })
          .where(eq(userWaterGoals.id, existingGoal.id))
          .returning();
        saved = updated;
      } else {
        const [created] = await db
          .insert(userWaterGoals)
          .values({
            userId,
            dailyTargetMl: parsedGoal.data.dailyTargetMl,
            containerSizeMl: parsedGoal.data.containerSizeMl || 250,
          })
          .returning();
        saved = created;
      }

      return NextResponse.json({
        success: true,
        message: "Water goal updated",
        data: saved,
      });
    }

    // Otherwise log water intake entry
    const parsed = logWaterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { amountMl, date } = parsed.data;
    const result = await logWater(userId, amountMl, date);

    return NextResponse.json(
      {
        success: true,
        message: `Logged ${amountMl} ml of water`,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/v1/nutrition/water error:", error);
    return NextResponse.json(
      { error: "Failed to log water", details: error.message },
      { status: 500 }
    );
  }
}

