import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { waterIntakeEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDailyWaterTotal } from "@/lib/services/diary-service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const entryId = params.id;

    const [existing] = await db
      .select()
      .from(waterIntakeEntries)
      .where(and(eq(waterIntakeEntries.id, entryId), eq(waterIntakeEntries.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Water entry not found" }, { status: 404 });
    }

    const body = await req.json();
    const amountMl = parseInt(body.amountMl, 10);
    if (isNaN(amountMl) || amountMl <= 0) {
      return NextResponse.json({ error: "Valid amountMl is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(waterIntakeEntries)
      .set({ amountMl })
      .where(eq(waterIntakeEntries.id, entryId))
      .returning();

    const newDailyTotal = await getDailyWaterTotal(userId, existing.logDate);

    return NextResponse.json({
      success: true,
      data: {
        entry: updated,
        dailyTotalMl: newDailyTotal,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/v1/nutrition/water/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update water entry", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const entryId = params.id;

    const [existing] = await db
      .select()
      .from(waterIntakeEntries)
      .where(and(eq(waterIntakeEntries.id, entryId), eq(waterIntakeEntries.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Water entry not found" }, { status: 404 });
    }

    const logDate = existing.logDate;
    await db.delete(waterIntakeEntries).where(eq(waterIntakeEntries.id, entryId));

    const newDailyTotal = await getDailyWaterTotal(userId, logDate);

    return NextResponse.json({
      success: true,
      message: "Water entry removed",
      data: {
        dailyTotalMl: newDailyTotal,
      },
    });
  } catch (error: any) {
    console.error("DELETE /api/v1/nutrition/water/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete water entry", details: error.message },
      { status: 500 }
    );
  }
}
