import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fitnessGoals, userProfiles } from "@/db/schema";
import { updateGoalSchema } from "@/lib/validations/goal";
import { calculateGoalTimeline, lbsToKg } from "@/lib/services/fitness-calculator";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to update your goal." },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;

    // Check goal existence and verify ownership
    const [existingGoal] = await db
      .select()
      .from(fitnessGoals)
      .where(and(eq(fitnessGoals.id, id), eq(fitnessGoals.userId, userId)))
      .limit(1);

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Goal not found or you do not have permission to modify it." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const result = updateGoalSchema.safeParse(body);

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
    const now = new Date();

    let targetWeightKg = data.targetWeight ?? existingGoal.targetWeight;
    let targetRate = data.targetRate ?? existingGoal.targetRate;
    let currentWeightKg = data.currentWeight ?? existingGoal.currentWeight;

    if (data.unit === "imperial") {
      if (data.targetWeight) targetWeightKg = lbsToKg(data.targetWeight);
      if (data.targetRate) targetRate = lbsToKg(data.targetRate);
      if (data.currentWeight) currentWeightKg = lbsToKg(data.currentWeight);
    }

    // Recalculate target date if weights or rate changed
    let targetDate = existingGoal.targetDate;
    if (currentWeightKg && targetWeightKg && targetRate) {
      const timeline = calculateGoalTimeline(
        currentWeightKg,
        targetWeightKg,
        targetRate,
        existingGoal.startDate
      );
      targetDate = timeline.estimatedCompletionDate;
    }

    // Build update object
    const updatePayload: Record<string, unknown> = {
      updatedAt: now,
    };

    if (data.status !== undefined) updatePayload.status = data.status;
    if (targetWeightKg !== undefined) updatePayload.targetWeight = targetWeightKg;
    if (currentWeightKg !== undefined) updatePayload.currentWeight = currentWeightKg;
    if (targetRate !== undefined) updatePayload.targetRate = targetRate;
    if (targetDate !== undefined) updatePayload.targetDate = targetDate;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const [updatedGoal] = await db
      .update(fitnessGoals)
      .set(updatePayload)
      .where(and(eq(fitnessGoals.id, id), eq(fitnessGoals.userId, userId)))
      .returning();

    // If current weight changed, keep user_profile in sync
    if (currentWeightKg && data.currentWeight !== undefined) {
      await db
        .update(userProfiles)
        .set({ currentWeight: currentWeightKg, updatedAt: now })
        .where(eq(userProfiles.userId, userId));
    }

    return NextResponse.json(
      {
        message: "Goal updated successfully.",
        goal: updatedGoal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while updating goal." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to delete this goal." },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;

    // Check ownership
    const [existing] = await db
      .select({ id: fitnessGoals.id })
      .from(fitnessGoals)
      .where(and(eq(fitnessGoals.id, id), eq(fitnessGoals.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Goal not found or access denied." },
        { status: 404 }
      );
    }

    await db
      .delete(fitnessGoals)
      .where(and(eq(fitnessGoals.id, id), eq(fitnessGoals.userId, userId)));

    return NextResponse.json(
      {
        message: "Goal deleted successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while deleting goal." },
      { status: 500 }
    );
  }
}

