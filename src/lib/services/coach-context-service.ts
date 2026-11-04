import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, gte, asc } from "drizzle-orm";

export interface CoachUserContext {
  userId: string;
  athleteName: string;
  profile: {
    age?: number;
    gender?: string;
    heightCm?: number;
    currentWeightKg?: number;
    activityLevel?: string;
    fitnessExperience?: string;
    bmrKcal?: number;
    tdeeKcal?: number;
    targetCaloriesKcal?: number;
    targetProteinGrams?: number;
    targetCarbsGrams?: number;
    targetFatGrams?: number;
  } | null;
  activeGoal: {
    goalType: string;
    targetWeightKg?: number | null;
    targetRateKgPerWeek?: number | null;
    startDate?: string;
    daysElapsed: number;
  } | null;
  nutrition: {
    hasActivePlan: boolean;
    planDailyCalories?: number;
    planDailyBudgetPkr?: number;
    planCity?: string;
    loggedDaysPast7d: number;
    avgActualCaloriesPast7d: number | null;
    avgActualProteinPast7d: number | null;
    avgWaterMlPast7d: number | null;
  };
  workouts: {
    assignedRoutinesCount: number;
    routineNames: string[];
    completedSessionsPast30d: number;
    totalVolumeKgPast30d: number;
    lastWorkoutDate?: string | null;
    topPersonalRecords: Array<{ exerciseName: string; recordType: string; value: number }>;
  };
  progress: {
    startingWeightKg?: number | null;
    currentWeightKg?: number | null;
    netWeightChangeKg: number | null;
    weeklyWeightRateKg: number | null;
    latestWaistCm?: number | null;
    waistChangeCm?: number | null;
    achievedMilestonesCount: number;
  };
  dataAvailability: {
    hasProfile: boolean;
    hasGoal: boolean;
    hasFoodLogs: boolean;
    hasWorkouts: boolean;
    hasMeasurements: boolean;
  };
}

export async function buildPersonalizedCoachContext(userId: string): Promise<CoachUserContext> {
  // 1. User & Profile
  const [user] = await db
    .select({ name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);

  const [assessment] = await db
    .select()
    .from(schema.bodyAssessments)
    .where(eq(schema.bodyAssessments.userId, userId))
    .orderBy(desc(schema.bodyAssessments.createdAt))
    .limit(1);

  // 2. Active Fitness Goal
  const [activeGoal] = await db
    .select()
    .from(schema.fitnessGoals)
    .where(and(eq(schema.fitnessGoals.userId, userId), eq(schema.fitnessGoals.status, "in_progress")))
    .orderBy(desc(schema.fitnessGoals.createdAt))
    .limit(1);

  let goalDaysElapsed = 0;
  if (activeGoal?.startDate) {
    goalDaysElapsed = Math.max(0, Math.floor((Date.now() - new Date(activeGoal.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  }

  // 3. Nutrition Plans & Actual Food Logs (Past 7 Days)
  const [activePlan] = await db
    .select()
    .from(schema.nutritionPlans)
    .where(and(eq(schema.nutritionPlans.userId, userId), eq(schema.nutritionPlans.status, "active")))
    .orderBy(desc(schema.nutritionPlans.createdAt))
    .limit(1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const recentFoodLogs = await db
    .select()
    .from(schema.dailyFoodLogs)
    .where(and(eq(schema.dailyFoodLogs.userId, userId), gte(schema.dailyFoodLogs.logDate, sevenDaysAgoStr)))
    .orderBy(asc(schema.dailyFoodLogs.logDate));

  let avgActualCalories: number | null = null;
  let avgActualProtein: number | null = null;
  if (recentFoodLogs.length > 0) {
    const totalCals = recentFoodLogs.reduce((acc, log) => acc + log.totalCalories, 0);
    const totalProt = recentFoodLogs.reduce((acc, log) => acc + log.totalProteinGrams, 0);
    avgActualCalories = Math.round(totalCals / recentFoodLogs.length);
    avgActualProtein = Math.round((totalProt / recentFoodLogs.length) * 10) / 10;
  }

  // Water entries past 7 days
  const recentWater = await db
    .select()
    .from(schema.waterIntakeEntries)
    .where(and(eq(schema.waterIntakeEntries.userId, userId), gte(schema.waterIntakeEntries.logDate, sevenDaysAgoStr)));

  let avgWater: number | null = null;
  if (recentWater.length > 0) {
    const totalWater = recentWater.reduce((acc, w) => acc + w.amountMl, 0);
    avgWater = Math.round(totalWater / Math.max(1, recentFoodLogs.length));
  }

  // 4. Workout Sessions & Routines (Past 30 Days)
  const routines = await db
    .select({ name: schema.workoutRoutines.name })
    .from(schema.workoutRoutines)
    .where(eq(schema.workoutRoutines.userId, userId));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completedSessions = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        eq(schema.workoutSessions.status, "completed"),
        gte(schema.workoutSessions.startTime, thirtyDaysAgo)
      )
    )
    .orderBy(desc(schema.workoutSessions.startTime));

  const totalVolume = completedSessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
  const lastWorkoutDate = completedSessions[0]?.startTime ? completedSessions[0].startTime.toISOString().split("T")[0] : null;

  // Personal Records
  const prs = await db
    .select({
      exerciseId: schema.personalRecords.exerciseId,
      recordType: schema.personalRecords.recordType,
      value: schema.personalRecords.value,
      exerciseName: schema.exercises.nameEn,
    })
    .from(schema.personalRecords)
    .leftJoin(schema.exercises, eq(schema.personalRecords.exerciseId, schema.exercises.id))
    .where(eq(schema.personalRecords.userId, userId))
    .orderBy(desc(schema.personalRecords.achievedAt))
    .limit(5);

  const topPrs = prs.map((p) => ({
    exerciseName: p.exerciseName || "Strength Exercise",
    recordType: p.recordType,
    value: p.value,
  }));

  // 5. Weight & Measurement History (Phase 8)
  const weightRecords = await db
    .select()
    .from(schema.bodyMeasurementHistory)
    .where(eq(schema.bodyMeasurementHistory.userId, userId))
    .orderBy(asc(schema.bodyMeasurementHistory.recordedAt));

  const firstWeight = weightRecords[0]?.weight ?? profile?.currentWeight ?? null;
  const latestWeight = weightRecords[weightRecords.length - 1]?.weight ?? profile?.currentWeight ?? null;
  let netWeightChange: number | null = null;
  let weeklyRate: number | null = null;

  if (firstWeight !== null && latestWeight !== null) {
    netWeightChange = Math.round((latestWeight - firstWeight) * 10) / 10;
    if (weightRecords.length >= 2) {
      const days = Math.max(1, (weightRecords[weightRecords.length - 1].recordedAt.getTime() - weightRecords[0].recordedAt.getTime()) / (1000 * 60 * 60 * 24));
      const weeks = days / 7;
      if (weeks >= 0.5) {
        weeklyRate = Math.round((netWeightChange / weeks) * 100) / 100;
      }
    }
  }

  // Circumferences
  const measurements = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(eq(schema.bodyMeasurements.userId, userId))
    .orderBy(desc(schema.bodyMeasurements.recordedAt))
    .limit(2);

  const latestM = measurements[0] || null;
  const prevM = measurements[1] || null;
  let waistChange: number | null = null;
  if (latestM?.waistCm && prevM?.waistCm) {
    waistChange = Math.round((latestM.waistCm - prevM.waistCm) * 10) / 10;
  }

  // Milestones
  const milestones = await db
    .select()
    .from(schema.progressMilestones)
    .where(and(eq(schema.progressMilestones.userId, userId), eq(schema.progressMilestones.isAchieved, true)));

  return {
    userId,
    athleteName: user?.name || "Athlete",
    profile: assessment
      ? {
          age: assessment.age,
          gender: assessment.gender || undefined,
          heightCm: assessment.height,
          currentWeightKg: latestWeight || assessment.weight,
          activityLevel: assessment.activityLevel,
          fitnessExperience: assessment.fitnessExperience || undefined,
          bmrKcal: Math.round(assessment.bmr),
          tdeeKcal: Math.round(assessment.tdee),
          targetCaloriesKcal: Math.round(assessment.targetCalories),
          targetProteinGrams: Math.round(assessment.targetProteinGrams),
          targetCarbsGrams: Math.round(assessment.targetCarbsGrams),
          targetFatGrams: Math.round(assessment.targetFatGrams),
        }
      : profile
      ? {
          heightCm: profile.height || undefined,
          currentWeightKg: latestWeight || profile.currentWeight || undefined,
        }
      : null,
    activeGoal: activeGoal
      ? {
          goalType: activeGoal.goalType,
          targetWeightKg: activeGoal.targetWeight,
          targetRateKgPerWeek: activeGoal.targetRate,
          startDate: activeGoal.startDate.toISOString().split("T")[0],
          daysElapsed: goalDaysElapsed,
        }
      : null,
    nutrition: {
      hasActivePlan: !!activePlan,
      planDailyCalories: activePlan ? Math.round(activePlan.targetCalories) : undefined,
      planDailyBudgetPkr: activePlan ? Math.round(activePlan.totalDailyCostPkr) : undefined,
      planCity: activePlan?.city || undefined,
      loggedDaysPast7d: recentFoodLogs.length,
      avgActualCaloriesPast7d: avgActualCalories,
      avgActualProteinPast7d: avgActualProtein,
      avgWaterMlPast7d: avgWater,
    },
    workouts: {
      assignedRoutinesCount: routines.length,
      routineNames: routines.map((r) => r.name),
      completedSessionsPast30d: completedSessions.length,
      totalVolumeKgPast30d: Math.round(totalVolume),
      lastWorkoutDate,
      topPersonalRecords: topPrs,
    },
    progress: {
      startingWeightKg: firstWeight,
      currentWeightKg: latestWeight,
      netWeightChangeKg: netWeightChange,
      weeklyWeightRateKg: weeklyRate,
      latestWaistCm: latestM?.waistCm || null,
      waistChangeCm: waistChange,
      achievedMilestonesCount: milestones.length,
    },
    dataAvailability: {
      hasProfile: !!assessment || !!profile,
      hasGoal: !!activeGoal,
      hasFoodLogs: recentFoodLogs.length > 0,
      hasWorkouts: completedSessions.length > 0,
      hasMeasurements: measurements.length > 0,
    },
  };
}

/**
 * Formats the context into a secure, concise text representation for the AI system prompt.
 * Strictly separates measured values from estimates, and planned targets from actual historical logs.
 */
export function formatCoachContextForPrompt(ctx: CoachUserContext): string {
  const lines: string[] = [];
  lines.push(`ATHLETE NAME: ${ctx.athleteName}`);

  // Profile & Physical Metrics
  if (ctx.profile) {
    lines.push("\n[BIOMETRICS & ESTIMATED TARGETS]");
    if (ctx.profile.age) lines.push(`- Age: ${ctx.profile.age} years`);
    if (ctx.profile.gender) lines.push(`- Biological sex: ${ctx.profile.gender}`);
    if (ctx.profile.heightCm) lines.push(`- Height: ${ctx.profile.heightCm} cm`);
    if (ctx.profile.currentWeightKg) lines.push(`- Measured Weight: ${ctx.profile.currentWeightKg} kg`);
    if (ctx.profile.activityLevel) lines.push(`- Activity Level: ${ctx.profile.activityLevel.replace("_", " ")}`);
    if (ctx.profile.bmrKcal && ctx.profile.tdeeKcal) {
      lines.push(`- Estimated BMR: ${ctx.profile.bmrKcal} kcal | Estimated TDEE: ${ctx.profile.tdeeKcal} kcal (Deterministic screening formulas)`);
    }
    if (ctx.profile.targetCaloriesKcal) {
      lines.push(
        `- Daily Calorie Target: ${ctx.profile.targetCaloriesKcal} kcal | Target Protein: ${ctx.profile.targetProteinGrams}g | Target Carbs: ${ctx.profile.targetCarbsGrams}g | Target Fat: ${ctx.profile.targetFatGrams}g`
      );
    }
  } else {
    lines.push("\n[BIOMETRICS]: No formal body assessment completed yet.");
  }

  // Active Goal
  if (ctx.activeGoal) {
    lines.push("\n[ACTIVE FITNESS GOAL]");
    lines.push(`- Primary Goal: ${ctx.activeGoal.goalType.replace("_", " ")}`);
    if (ctx.activeGoal.targetWeightKg) lines.push(`- Target Weight: ${ctx.activeGoal.targetWeightKg} kg`);
    if (ctx.activeGoal.targetRateKgPerWeek) lines.push(`- Target Rate: ${ctx.activeGoal.targetRateKgPerWeek} kg/week`);
    lines.push(`- Days on Goal: ${ctx.activeGoal.daysElapsed} days (started ${ctx.activeGoal.startDate})`);
  } else {
    lines.push("\n[ACTIVE FITNESS GOAL]: No active goal set.");
  }

  // Nutrition (Planned vs Actual)
  lines.push("\n[NUTRITION: PLANNED VS ACTUAL (PAST 7 DAYS)]");
  if (ctx.nutrition.hasActivePlan) {
    lines.push(`- Planned Meal Schedule: ${ctx.nutrition.planDailyCalories} kcal/day | Budget: ~${ctx.nutrition.planDailyBudgetPkr} PKR/day in ${ctx.nutrition.planCity || "Pakistan"}`);
  } else {
    lines.push("- No active meal plan saved.");
  }
  if (ctx.nutrition.loggedDaysPast7d > 0) {
    lines.push(`- Actual Diary Logs: ${ctx.nutrition.loggedDaysPast7d} out of 7 days recorded`);
    lines.push(`- Actual Average Consumed: ${ctx.nutrition.avgActualCaloriesPast7d} kcal/day (Target: ${ctx.profile?.targetCaloriesKcal ?? "N/A"} kcal)`);
    lines.push(`- Actual Average Protein: ${ctx.nutrition.avgActualProteinPast7d}g/day (Target: ${ctx.profile?.targetProteinGrams ?? "N/A"}g)`);
    if (ctx.nutrition.avgWaterMlPast7d) {
      lines.push(`- Actual Average Water: ${ctx.nutrition.avgWaterMlPast7d} ml/day`);
    }
  } else {
    lines.push("- Actual Diary Logs: No food logs recorded in the past 7 days.");
  }

  // Workouts (Past 30 Days)
  lines.push("\n[WORKOUT PERFORMANCE (PAST 30 DAYS)]");
  if (ctx.workouts.assignedRoutinesCount > 0) {
    lines.push(`- Available Routines (${ctx.workouts.assignedRoutinesCount}): ${ctx.workouts.routineNames.join(", ")}`);
  }
  lines.push(`- Completed Sessions: ${ctx.workouts.completedSessionsPast30d} workouts completed`);
  if (ctx.workouts.completedSessionsPast30d > 0) {
    lines.push(`- Total Volume Moved: ${ctx.workouts.totalVolumeKgPast30d.toLocaleString()} kg`);
    lines.push(`- Last Workout Date: ${ctx.workouts.lastWorkoutDate}`);
  }
  if (ctx.workouts.topPersonalRecords.length > 0) {
    const prStrs = ctx.workouts.topPersonalRecords.map((p) => `${p.exerciseName}: ${p.value} kg (${p.recordType})`);
    lines.push(`- Top Personal Records: ${prStrs.join("; ")}`);
  }

  // Progress (Past 30 Days)
  lines.push("\n[MEASURED PROGRESS & BODY METRICS]");
  if (ctx.progress.startingWeightKg && ctx.progress.currentWeightKg) {
    lines.push(`- Starting Weight: ${ctx.progress.startingWeightKg} kg -> Current Weight: ${ctx.progress.currentWeightKg} kg`);
    lines.push(`- Net Weight Delta: ${ctx.progress.netWeightChangeKg !== null && ctx.progress.netWeightChangeKg > 0 ? "+" : ""}${ctx.progress.netWeightChangeKg} kg`);
    if (ctx.progress.weeklyWeightRateKg !== null) {
      lines.push(`- Average Weekly Rate: ${ctx.progress.weeklyWeightRateKg > 0 ? "+" : ""}${ctx.progress.weeklyWeightRateKg} kg/week`);
    }
  }
  if (ctx.progress.latestWaistCm) {
    lines.push(`- Latest Measured Waist: ${ctx.progress.latestWaistCm} cm${ctx.progress.waistChangeCm ? ` (${ctx.progress.waistChangeCm > 0 ? "+" : ""}${ctx.progress.waistChangeCm} cm vs previous)` : ""}`);
  }
  lines.push(`- Milestones Achieved: ${ctx.progress.achievedMilestonesCount}`);

  return lines.join("\n");
}
