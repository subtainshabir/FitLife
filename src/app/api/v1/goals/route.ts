import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { fitnessGoals, userProfiles } from "@/db/schema";
import { createGoalSchema } from "@/lib/validations/goal";
import { calculateGoalTimeline, lbsToKg } from "@/lib/services/fitness-calculator";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view your goals." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Retrieve all goals for this user
    const goalsList = await db
      .select()
      .from(fitnessGoals)
      .where(eq(fitnessGoals.userId, userId))
      .orderBy(desc(fitnessGoals.createdAt));

    // Find current active goal
    const activeGoal = goalsList.find((g) => g.status === "in_progress") || null;

    // Retrieve profile for current live weight
    const [profile] = await db
      .select({ currentWeight: userProfiles.currentWeight, height: userProfiles.height })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // Calculate live progress if active goal exists
    let activeGoalProgress = null;
    if (activeGoal && activeGoal.targetWeight && activeGoal.currentWeight) {
      const currentLiveWeight = profile?.currentWeight ?? activeGoal.currentWeight;
      const initialWeight = activeGoal.currentWeight;
      const targetWeight = activeGoal.targetWeight;
      const totalDeltaNeeded = Math.abs(initialWeight - targetWeight);
      const currentDeltaAchieved = Math.abs(initialWeight - currentLiveWeight);

      let percentage = 0;
      if (totalDeltaNeeded > 0) {
        // Check if progress is moving in correct direction
        const isLoss = targetWeight < initialWeight;
        const progressMade = isLoss ? initialWeight - currentLiveWeight : currentLiveWeight - initialWeight;
        percentage = Math.max(0, Math.min(100, Math.round((progressMade / totalDeltaNeeded) * 100)));
      }

      const timeline = calculateGoalTimeline(
        currentLiveWeight,
        targetWeight,
        activeGoal.targetRate ?? 0.5,
        activeGoal.startDate,
        profile?.height ?? undefined
      );

      activeGoalProgress = {
        percentage,
        initialWeight,
        currentLiveWeight,
        targetWeight,
        weightRemainingKg: Math.round(Math.abs(targetWeight - currentLiveWeight) * 10) / 10,
        timeline,
      };
    }

    return NextResponse.json(
      {
        activeGoal,
        activeGoalProgress,
        goals: goalsList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get goals error:", error);
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
        { error: "Unauthorized. Please log in to create a fitness goal." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = createGoalSchema.safeParse(body);

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

    let currentWeightKg = data.currentWeight;
    let targetWeightKg = data.targetWeight;
    let targetRateKgPerWeek = data.targetRate;

    // Convert imperial units if submitted
    if (data.unit === "imperial") {
      currentWeightKg = lbsToKg(data.currentWeight);
      if (data.targetWeight) targetWeightKg = lbsToKg(data.targetWeight);
      if (data.targetRate) targetRateKgPerWeek = lbsToKg(data.targetRate);
    }

    // Retrieve profile to check height and age for safety rules
    const [profile] = await db
      .select({
        height: userProfiles.height,
        dateOfBirth: userProfiles.dateOfBirth,
      })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    let age: number | undefined;
    if (profile?.dateOfBirth) {
      const birth = new Date(profile.dateOfBirth);
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Calculate deterministic timeline and safe parameters
    const timeline = calculateGoalTimeline(
      currentWeightKg,
      targetWeightKg,
      targetRateKgPerWeek,
      data.startDate,
      profile?.height ?? undefined,
      age
    );

    const now = new Date();
    const startDate = data.startDate ? new Date(data.startDate) : now;

    // If an in_progress goal already exists, archive or pause it
    await db
      .update(fitnessGoals)
      .set({ status: "paused", updatedAt: now })
      .where(and(eq(fitnessGoals.userId, userId), eq(fitnessGoals.status, "in_progress")));

    // Create the new goal
    const [createdGoal] = await db
      .insert(fitnessGoals)
      .values({
        userId,
        goalType: data.goalType,
        currentWeight: currentWeightKg,
        targetWeight: targetWeightKg || null,
        targetRate: timeline.targetRateKgPerWeek || null,
        startDate,
        targetDate: timeline.estimatedCompletionDate,
        status: "in_progress",
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update profile's fitnessGoal and currentWeight
    await db
      .update(userProfiles)
      .set({
        fitnessGoal: data.goalType,
        currentWeight: currentWeightKg,
        updatedAt: now,
      })
      .where(eq(userProfiles.userId, userId));

    return NextResponse.json(
      {
        message: "Fitness goal created successfully.",
        goal: createdGoal,
        timeline,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while creating goal." },
      { status: 500 }
    );
  }
}

