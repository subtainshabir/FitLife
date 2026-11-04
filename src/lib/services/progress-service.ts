import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { existsSync, createReadStream } from "fs";

// -----------------------------------------------------------------------------
// CONSTANTS & UNIT CONVERSIONS
// -----------------------------------------------------------------------------

export const STORAGE_ROOT = path.join(process.cwd(), "storage", "progress-photos");

export function cmToIn(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

// -----------------------------------------------------------------------------
// 1. WEIGHT PROGRESS TRACKING (Single Source of Truth)
// -----------------------------------------------------------------------------

export interface WeightHistoryResponse {
  history: Array<{
    id: string;
    weightKg: number;
    weightLbs: number;
    unit: string;
    source: string;
    notes: string | null;
    recordedAt: string;
  }>;
  startingWeightKg: number | null;
  startingWeightLbs: number | null;
  currentWeightKg: number | null;
  currentWeightLbs: number | null;
  targetWeightKg: number | null;
  targetWeightLbs: number | null;
  netChangeKg: number;
  netChangeLbs: number;
  weeklyAverageChangeKg: number;
  monthlyAverageChangeKg: number;
  goalProgressPercentage: number | null;
  goalType: string | null;
  isGoalReached: boolean;
  totalEntries: number;
}

export async function getWeightHistory(userId: string): Promise<WeightHistoryResponse> {
  // Query all weight entries chronologically
  const entries = await db
    .select()
    .from(schema.bodyMeasurementHistory)
    .where(eq(schema.bodyMeasurementHistory.userId, userId))
    .orderBy(asc(schema.bodyMeasurementHistory.recordedAt));

  // Also query active goal and profile
  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);

  const [activeGoal] = await db
    .select()
    .from(schema.fitnessGoals)
    .where(and(eq(schema.fitnessGoals.userId, userId), eq(schema.fitnessGoals.status, "in_progress")))
    .orderBy(desc(schema.fitnessGoals.createdAt))
    .limit(1);

  const formattedHistory = entries.map((e) => ({
    id: e.id,
    weightKg: Math.round(e.weight * 10) / 10,
    weightLbs: kgToLbs(e.weight),
    unit: e.unit,
    source: e.source,
    notes: e.notes,
    recordedAt: e.recordedAt.toISOString(),
  }));

  const oldest = entries[0];
  const latest = entries[entries.length - 1];

  const startingWeightKg = oldest ? Math.round(oldest.weight * 10) / 10 : profile?.currentWeight ?? null;
  const currentWeightKg = latest ? Math.round(latest.weight * 10) / 10 : profile?.currentWeight ?? null;
  const targetWeightKg = activeGoal?.targetWeight ? Math.round(activeGoal.targetWeight * 10) / 10 : null;

  const startingWeightLbs = startingWeightKg !== null ? kgToLbs(startingWeightKg) : null;
  const currentWeightLbs = currentWeightKg !== null ? kgToLbs(currentWeightKg) : null;
  const targetWeightLbs = targetWeightKg !== null ? kgToLbs(targetWeightKg) : null;

  let netChangeKg = 0;
  if (currentWeightKg !== null && startingWeightKg !== null) {
    netChangeKg = Math.round((currentWeightKg - startingWeightKg) * 10) / 10;
  }
  const netChangeLbs = Math.round(netChangeKg * 2.20462 * 10) / 10;

  // Calculate rate of change
  let weeklyAverageChangeKg = 0;
  let monthlyAverageChangeKg = 0;
  if (entries.length >= 2 && oldest && latest) {
    const timeDiffMs = latest.recordedAt.getTime() - oldest.recordedAt.getTime();
    const daysDiff = Math.max(1, timeDiffMs / (1000 * 60 * 60 * 24));
    const weeksDiff = daysDiff / 7;
    if (weeksDiff >= 0.5) {
      weeklyAverageChangeKg = Math.round((netChangeKg / weeksDiff) * 100) / 100;
      monthlyAverageChangeKg = Math.round((weeklyAverageChangeKg * 4.33) * 10) / 10;
    }
  }

  // Calculate Goal Progress % accurately based on goal direction
  let goalProgressPercentage: number | null = null;
  let isGoalReached = false;
  const goalType = activeGoal?.goalType || null;

  if (startingWeightKg !== null && currentWeightKg !== null && targetWeightKg !== null) {
    const isLoss = goalType === "weight_loss" || goalType === "fat_reduction" || targetWeightKg < startingWeightKg;
    const isGain = goalType === "weight_gain" || goalType === "muscle_building" || targetWeightKg > startingWeightKg;

    if (isLoss) {
      const totalToLose = startingWeightKg - targetWeightKg;
      if (totalToLose > 0) {
        const lostSoFar = startingWeightKg - currentWeightKg;
        const progress = (lostSoFar / totalToLose) * 100;
        goalProgressPercentage = Math.round(Math.max(0, Math.min(100, progress)));
        isGoalReached = currentWeightKg <= targetWeightKg;
      }
    } else if (isGain) {
      const totalToGain = targetWeightKg - startingWeightKg;
      if (totalToGain > 0) {
        const gainedSoFar = currentWeightKg - startingWeightKg;
        const progress = (gainedSoFar / totalToGain) * 100;
        goalProgressPercentage = Math.round(Math.max(0, Math.min(100, progress)));
        isGoalReached = currentWeightKg >= targetWeightKg;
      }
    } else {
      // Weight maintenance
      const diff = Math.abs(currentWeightKg - targetWeightKg);
      if (diff <= 1.0) {
        goalProgressPercentage = 100;
        isGoalReached = true;
      } else {
        goalProgressPercentage = Math.round(Math.max(0, 100 - diff * 10));
      }
    }
  }

  return {
    history: formattedHistory,
    startingWeightKg,
    startingWeightLbs,
    currentWeightKg,
    currentWeightLbs,
    targetWeightKg,
    targetWeightLbs,
    netChangeKg,
    netChangeLbs,
    weeklyAverageChangeKg,
    monthlyAverageChangeKg,
    goalProgressPercentage,
    goalType,
    isGoalReached,
    totalEntries: entries.length,
  };
}

export async function logWeightEntry(
  userId: string,
  data: {
    weight: number;
    unit?: "kg" | "lbs";
    notes?: string | null;
    recordedAt?: string | Date;
    updateProfileCurrentWeight?: boolean;
    source?: string;
  }
) {
  const unit = data.unit || "kg";
  let weightKg = data.weight;
  if (unit === "lbs") {
    weightKg = lbsToKg(data.weight);
  }

  const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date();
  const source = data.source || "manual";

  const [saved] = await db
    .insert(schema.bodyMeasurementHistory)
    .values({
      userId,
      weight: weightKg,
      unit,
      source,
      notes: data.notes || null,
      recordedAt,
    })
    .returning();

  // If user requested or default manual log, keep profile current weight in sync
  if (data.updateProfileCurrentWeight !== false) {
    await db
      .update(schema.userProfiles)
      .set({
        currentWeight: weightKg,
        updatedAt: new Date(),
      })
      .where(eq(schema.userProfiles.userId, userId));
  }

  // Auto-evaluate milestones
  await evaluateAndSyncMilestones(userId);

  return saved;
}

export async function updateWeightEntry(
  userId: string,
  id: string,
  data: {
    weight?: number;
    unit?: "kg" | "lbs";
    notes?: string | null;
    recordedAt?: string | Date;
  }
) {
  const [existing] = await db
    .select()
    .from(schema.bodyMeasurementHistory)
    .where(and(eq(schema.bodyMeasurementHistory.id, id), eq(schema.bodyMeasurementHistory.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error("Weight entry not found or access denied.");
  }

  let weightKg = existing.weight;
  let unit = existing.unit;
  if (data.weight !== undefined) {
    unit = data.unit || existing.unit;
    weightKg = unit === "lbs" ? lbsToKg(data.weight) : data.weight;
  }

  const updateFields: Partial<typeof schema.bodyMeasurementHistory.$inferInsert> = {
    weight: weightKg,
    unit,
  };

  if (data.notes !== undefined) updateFields.notes = data.notes;
  if (data.recordedAt !== undefined) updateFields.recordedAt = new Date(data.recordedAt);

  const [updated] = await db
    .update(schema.bodyMeasurementHistory)
    .set(updateFields)
    .where(eq(schema.bodyMeasurementHistory.id, id))
    .returning();

  return updated;
}

export async function deleteWeightEntry(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.bodyMeasurementHistory)
    .where(and(eq(schema.bodyMeasurementHistory.id, id), eq(schema.bodyMeasurementHistory.userId, userId)))
    .returning();

  if (!deleted) {
    throw new Error("Weight entry not found or access denied.");
  }
  return deleted;
}

// -----------------------------------------------------------------------------
// 2. BODY MEASUREMENT TRACKING (Circumferences & Body Fat)
// -----------------------------------------------------------------------------

export interface BodyMeasurementInput {
  recordedAt?: string | Date;
  unitSystem?: "metric" | "imperial";
  weight?: number | null;
  height?: number | null;
  bodyFatPercentage?: number | null;
  waist?: number | null;
  chest?: number | null;
  hip?: number | null;
  neck?: number | null;
  arm?: number | null;
  forearm?: number | null;
  thigh?: number | null;
  calf?: number | null;
  notes?: string | null;
}

export async function logBodyMeasurement(userId: string, input: BodyMeasurementInput) {
  const unitSystem = input.unitSystem || "metric";
  const isImperial = unitSystem === "imperial";

  // Convert to metric for internal storage
  const weightKg = input.weight !== undefined && input.weight !== null ? (isImperial ? lbsToKg(input.weight) : input.weight) : null;
  const heightCm = input.height !== undefined && input.height !== null ? (isImperial ? inToCm(input.height) : input.height) : null;
  const waistCm = input.waist !== undefined && input.waist !== null ? (isImperial ? inToCm(input.waist) : input.waist) : null;
  const chestCm = input.chest !== undefined && input.chest !== null ? (isImperial ? inToCm(input.chest) : input.chest) : null;
  const hipCm = input.hip !== undefined && input.hip !== null ? (isImperial ? inToCm(input.hip) : input.hip) : null;
  const neckCm = input.neck !== undefined && input.neck !== null ? (isImperial ? inToCm(input.neck) : input.neck) : null;
  const armCm = input.arm !== undefined && input.arm !== null ? (isImperial ? inToCm(input.arm) : input.arm) : null;
  const forearmCm = input.forearm !== undefined && input.forearm !== null ? (isImperial ? inToCm(input.forearm) : input.forearm) : null;
  const thighCm = input.thigh !== undefined && input.thigh !== null ? (isImperial ? inToCm(input.thigh) : input.thigh) : null;
  const calfCm = input.calf !== undefined && input.calf !== null ? (isImperial ? inToCm(input.calf) : input.calf) : null;

  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

  const [saved] = await db
    .insert(schema.bodyMeasurements)
    .values({
      userId,
      recordedAt,
      weightKg,
      heightCm,
      bodyFatPercentage: input.bodyFatPercentage ?? null,
      waistCm,
      chestCm,
      hipCm,
      neckCm,
      armCm,
      forearmCm,
      thighCm,
      calfCm,
      unitSystem,
      notes: input.notes || null,
    })
    .returning();

  // If weight is provided, ALSO log to bodyMeasurementHistory to establish one source of truth!
  if (weightKg !== null) {
    await db.insert(schema.bodyMeasurementHistory).values({
      userId,
      weight: weightKg,
      height: heightCm,
      unit: isImperial ? "lbs" : "kg",
      source: "measurement",
      notes: input.notes ? `From body measurement: ${input.notes}` : "Recorded with body measurements",
      recordedAt,
    });
  }

  // Auto-evaluate milestones
  await evaluateAndSyncMilestones(userId);

  return saved;
}

export async function getBodyMeasurements(userId: string) {
  const records = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(eq(schema.bodyMeasurements.userId, userId))
    .orderBy(desc(schema.bodyMeasurements.recordedAt));

  const latest = records[0] || null;
  const previous = records[1] || null;

  // Calculate deltas between latest and previous
  const deltas: Record<string, { cm: number | null; in: number | null }> = {};
  const metrics = ["waistCm", "chestCm", "hipCm", "neckCm", "armCm", "forearmCm", "thighCm", "calfCm", "weightKg", "bodyFatPercentage"] as const;

  for (const m of metrics) {
    if (latest && previous && (latest as any)[m] !== null && (previous as any)[m] !== null) {
      const diff = Math.round(((latest as any)[m] - (previous as any)[m]) * 10) / 10;
      deltas[m] = {
        cm: diff,
        in: m === "weightKg" || m === "bodyFatPercentage" ? diff : cmToIn(diff),
      };
    } else {
      deltas[m] = { cm: null, in: null };
    }
  }

  return {
    records,
    latest,
    previous,
    deltas,
    totalRecords: records.length,
  };
}

export async function updateBodyMeasurement(userId: string, id: string, input: Partial<BodyMeasurementInput>) {
  const [existing] = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(and(eq(schema.bodyMeasurements.id, id), eq(schema.bodyMeasurements.userId, userId)))
    .limit(1);

  if (!existing) {
    throw new Error("Measurement record not found or access denied.");
  }

  const isImperial = (input.unitSystem || existing.unitSystem) === "imperial";

  const updateData: Partial<typeof schema.bodyMeasurements.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.recordedAt !== undefined) updateData.recordedAt = new Date(input.recordedAt);
  if (input.unitSystem !== undefined) updateData.unitSystem = input.unitSystem;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.bodyFatPercentage !== undefined) updateData.bodyFatPercentage = input.bodyFatPercentage;

  if (input.weight !== undefined) updateData.weightKg = input.weight !== null ? (isImperial ? lbsToKg(input.weight) : input.weight) : null;
  if (input.height !== undefined) updateData.heightCm = input.height !== null ? (isImperial ? inToCm(input.height) : input.height) : null;
  if (input.waist !== undefined) updateData.waistCm = input.waist !== null ? (isImperial ? inToCm(input.waist) : input.waist) : null;
  if (input.chest !== undefined) updateData.chestCm = input.chest !== null ? (isImperial ? inToCm(input.chest) : input.chest) : null;
  if (input.hip !== undefined) updateData.hipCm = input.hip !== null ? (isImperial ? inToCm(input.hip) : input.hip) : null;
  if (input.neck !== undefined) updateData.neckCm = input.neck !== null ? (isImperial ? inToCm(input.neck) : input.neck) : null;
  if (input.arm !== undefined) updateData.armCm = input.arm !== null ? (isImperial ? inToCm(input.arm) : input.arm) : null;
  if (input.forearm !== undefined) updateData.forearmCm = input.forearm !== null ? (isImperial ? inToCm(input.forearm) : input.forearm) : null;
  if (input.thigh !== undefined) updateData.thighCm = input.thigh !== null ? (isImperial ? inToCm(input.thigh) : input.thigh) : null;
  if (input.calf !== undefined) updateData.calfCm = input.calf !== null ? (isImperial ? inToCm(input.calf) : input.calf) : null;

  const [updated] = await db
    .update(schema.bodyMeasurements)
    .set(updateData)
    .where(eq(schema.bodyMeasurements.id, id))
    .returning();

  return updated;
}

export async function deleteBodyMeasurement(userId: string, id: string) {
  const [deleted] = await db
    .delete(schema.bodyMeasurements)
    .where(and(eq(schema.bodyMeasurements.id, id), eq(schema.bodyMeasurements.userId, userId)))
    .returning();

  if (!deleted) {
    throw new Error("Measurement record not found or access denied.");
  }
  return deleted;
}

// -----------------------------------------------------------------------------
// 3. TRANSFORMATION OVERVIEW & DASHBOARD
// -----------------------------------------------------------------------------

export async function getTransformationOverview(userId: string) {
  const weightData = await getWeightHistory(userId);
  const measurementData = await getBodyMeasurements(userId);

  // Active fitness goal
  const [activeGoal] = await db
    .select()
    .from(schema.fitnessGoals)
    .where(and(eq(schema.fitnessGoals.userId, userId), eq(schema.fitnessGoals.status, "in_progress")))
    .orderBy(desc(schema.fitnessGoals.createdAt))
    .limit(1);

  let daysElapsed = 0;
  if (activeGoal) {
    const startMs = new Date(activeGoal.startDate).getTime();
    daysElapsed = Math.max(0, Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24)));
  }

  // Photos summary
  const photos = await db
    .select()
    .from(schema.transformationPhotos)
    .where(and(eq(schema.transformationPhotos.userId, userId), eq(schema.transformationPhotos.isHidden, false)))
    .orderBy(desc(schema.transformationPhotos.photoDate));

  // Workout sessions summary (Phase 6)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentWorkouts = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.userId, userId), gte(schema.workoutSessions.startTime, thirtyDaysAgo)));

  // Nutrition compliance summary (Phase 7)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split("T")[0];

  const recentFoodLogs = await db
    .select()
    .from(schema.dailyFoodLogs)
    .where(and(eq(schema.dailyFoodLogs.userId, userId), gte(schema.dailyFoodLogs.logDate, dateStr)));

  let averageCalories = 0;
  let averageProtein = 0;
  if (recentFoodLogs.length > 0) {
    const totalCals = recentFoodLogs.reduce((acc, log) => acc + log.totalCalories, 0);
    const totalProt = recentFoodLogs.reduce((acc, log) => acc + log.totalProteinGrams, 0);
    averageCalories = Math.round(totalCals / recentFoodLogs.length);
    averageProtein = Math.round((totalProt / recentFoodLogs.length) * 10) / 10;
  }

  // Milestones summary
  const milestones = await db
    .select()
    .from(schema.progressMilestones)
    .where(eq(schema.progressMilestones.userId, userId));

  const achievedMilestones = milestones.filter((m) => m.isAchieved);

  return {
    weight: {
      startingKg: weightData.startingWeightKg,
      currentKg: weightData.currentWeightKg,
      targetKg: weightData.targetWeightKg,
      startingLbs: weightData.startingWeightLbs,
      currentLbs: weightData.currentWeightLbs,
      targetLbs: weightData.targetWeightLbs,
      netChangeKg: weightData.netChangeKg,
      netChangeLbs: weightData.netChangeLbs,
      progressPercentage: weightData.goalProgressPercentage,
      weeklyRateKg: weightData.weeklyAverageChangeKg,
      monthlyRateKg: weightData.monthlyAverageChangeKg,
      isGoalReached: weightData.isGoalReached,
    },
    goal: activeGoal
      ? {
          id: activeGoal.id,
          goalType: activeGoal.goalType,
          startDate: activeGoal.startDate.toISOString(),
          targetDate: activeGoal.targetDate ? activeGoal.targetDate.toISOString() : null,
          targetRate: activeGoal.targetRate,
          daysElapsed,
          status: activeGoal.status,
        }
      : null,
    measurements: {
      latest: measurementData.latest,
      deltas: measurementData.deltas,
      totalEntries: measurementData.totalRecords,
    },
    photos: {
      totalCount: photos.length,
      latestPhoto: photos[0]
        ? {
            id: photos[0].id,
            photoDate: photos[0].photoDate.toISOString(),
            viewAngle: photos[0].viewAngle,
            weightKg: photos[0].weightKg,
            fileUrl: `/api/v1/progress/photos/${photos[0].id}/file`,
          }
        : null,
    },
    workouts: {
      past30DaysCount: recentWorkouts.length,
      trainingConsistencyPercent: Math.min(100, Math.round((recentWorkouts.length / 16) * 100)), // based on ~4 days/wk standard
    },
    nutrition: {
      loggedDaysCount: recentFoodLogs.length,
      averageCalories,
      averageProtein,
    },
    milestones: {
      totalAchieved: achievedMilestones.length,
      totalCount: milestones.length,
    },
  };
}

// -----------------------------------------------------------------------------
// 4. PROGRESS ANALYTICS FOR RECHARTS
// -----------------------------------------------------------------------------

export async function getProgressAnalytics(userId: string, timeframe: "7d" | "30d" | "90d" | "1y" | "all" = "30d") {
  let startDate = new Date();
  if (timeframe === "7d") startDate.setDate(startDate.getDate() - 7);
  else if (timeframe === "30d") startDate.setDate(startDate.getDate() - 30);
  else if (timeframe === "90d") startDate.setDate(startDate.getDate() - 90);
  else if (timeframe === "1y") startDate.setFullYear(startDate.getFullYear() - 1);
  else startDate = new Date(0); // all time

  if (timeframe !== "all") {
    startDate.setHours(0, 0, 0, 0);
  }

  // 1. Weight Series
  const weightRows = await db
    .select()
    .from(schema.bodyMeasurementHistory)
    .where(and(eq(schema.bodyMeasurementHistory.userId, userId), gte(schema.bodyMeasurementHistory.recordedAt, startDate)))
    .orderBy(asc(schema.bodyMeasurementHistory.recordedAt));

  const [activeGoal] = await db
    .select()
    .from(schema.fitnessGoals)
    .where(and(eq(schema.fitnessGoals.userId, userId), eq(schema.fitnessGoals.status, "in_progress")))
    .orderBy(desc(schema.fitnessGoals.createdAt))
    .limit(1);

  const targetWeight = activeGoal?.targetWeight || null;
  const startWeight = weightRows[0]?.weight || null;

  // Moving average calculation (window 3 entries)
  const weightSeries = weightRows.map((row, idx, arr) => {
    let windowSum = 0;
    let windowCount = 0;
    for (let i = Math.max(0, idx - 2); i <= idx; i++) {
      windowSum += arr[i].weight;
      windowCount++;
    }
    const movingAvg = Math.round((windowSum / windowCount) * 10) / 10;

    return {
      date: row.recordedAt.toISOString().split("T")[0],
      timestamp: row.recordedAt.getTime(),
      weightKg: Math.round(row.weight * 10) / 10,
      weightLbs: kgToLbs(row.weight),
      movingAvgKg: movingAvg,
      targetWeightKg: targetWeight,
      startWeightKg: startWeight,
      notes: row.notes,
    };
  });

  // 2. Measurements Series
  const measurementRows = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(and(eq(schema.bodyMeasurements.userId, userId), gte(schema.bodyMeasurements.recordedAt, startDate)))
    .orderBy(asc(schema.bodyMeasurements.recordedAt));

  const measurementSeries = measurementRows.map((row) => ({
    date: row.recordedAt.toISOString().split("T")[0],
    timestamp: row.recordedAt.getTime(),
    waistCm: row.waistCm,
    chestCm: row.chestCm,
    hipCm: row.hipCm,
    armCm: row.armCm,
    thighCm: row.thighCm,
    neckCm: row.neckCm,
    bodyFatPercentage: row.bodyFatPercentage,
    waistIn: row.waistCm ? cmToIn(row.waistCm) : null,
    chestIn: row.chestCm ? cmToIn(row.chestCm) : null,
    armIn: row.armCm ? cmToIn(row.armCm) : null,
    hipIn: row.hipCm ? cmToIn(row.hipCm) : null,
  }));

  // 3. Workout Volume & Consistency (Phase 6)
  const workoutRows = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.userId, userId), gte(schema.workoutSessions.startTime, startDate)))
    .orderBy(asc(schema.workoutSessions.startTime));

  const workoutSeries = workoutRows.map((row) => ({
    date: row.startTime.toISOString().split("T")[0],
    timestamp: row.startTime.getTime(),
    volumeKg: Math.round(row.totalVolumeKg || 0),
    durationMinutes: row.durationSeconds ? Math.round(row.durationSeconds / 60) : 0,
    rating: row.rating,
    isCompleted: row.status === "completed",
  }));

  // 4. Nutrition Consistency (Phase 7)
  const startStr = startDate.toISOString().split("T")[0];
  const nutritionRows = await db
    .select()
    .from(schema.dailyFoodLogs)
    .where(and(eq(schema.dailyFoodLogs.userId, userId), gte(schema.dailyFoodLogs.logDate, startStr)))
    .orderBy(asc(schema.dailyFoodLogs.logDate));

  const nutritionSeries = nutritionRows.map((row) => ({
    date: row.logDate,
    calories: Math.round(row.totalCalories),
    targetCalories: Math.round(row.targetCalories),
    proteinGrams: Math.round(row.totalProteinGrams * 10) / 10,
    targetProteinGrams: Math.round(row.targetProteinGrams * 10) / 10,
    carbsGrams: Math.round(row.totalCarbsGrams * 10) / 10,
    fatGrams: Math.round(row.totalFatGrams * 10) / 10,
  }));

  return {
    timeframe,
    startDate: startDate.toISOString(),
    weightSeries,
    measurementSeries,
    workoutSeries,
    nutritionSeries,
  };
}

// -----------------------------------------------------------------------------
// 5. SECURE TRANSFORMATION PHOTO JOURNAL
// -----------------------------------------------------------------------------

export async function saveTransformationPhoto(
  userId: string,
  file: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    size: number;
  },
  metadata: {
    viewAngle: "front" | "side" | "back" | "other";
    photoDate?: string | Date;
    weightKg?: number;
    isHidden?: boolean;
    notes?: string;
  }
) {
  // Validate MIME type
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(metadata.viewAngle && file.mimeType)) {
    throw new Error("Invalid image type. Only JPEG, PNG, and WebP are supported.");
  }

  // Validate size (max 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit.");
  }

  const userDir = path.join(STORAGE_ROOT, userId);
  await fs.mkdir(userDir, { recursive: true });

  const ext = file.fileName.split(".").pop() || "jpg";
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const relativePath = path.join(userId, uniqueName);
  const absolutePath = path.join(STORAGE_ROOT, relativePath);

  await fs.writeFile(absolutePath, file.buffer);

  const photoDate = metadata.photoDate ? new Date(metadata.photoDate) : new Date();

  const [saved] = await db
    .insert(schema.transformationPhotos)
    .values({
      userId,
      photoDate,
      viewAngle: metadata.viewAngle,
      weightKg: metadata.weightKg ?? null,
      storagePath: relativePath,
      fileName: file.fileName,
      fileSize: file.size,
      mimeType: file.mimeType,
      isHidden: metadata.isHidden ?? false,
      notes: metadata.notes || null,
    })
    .returning();

  return {
    ...saved,
    fileUrl: `/api/v1/progress/photos/${saved.id}/file`,
  };
}

export async function getTransformationPhotos(userId: string) {
  const photos = await db
    .select()
    .from(schema.transformationPhotos)
    .where(eq(schema.transformationPhotos.userId, userId))
    .orderBy(desc(schema.transformationPhotos.photoDate));

  return photos.map((p) => ({
    id: p.id,
    photoDate: p.photoDate.toISOString(),
    viewAngle: p.viewAngle,
    weightKg: p.weightKg,
    fileSize: p.fileSize,
    mimeType: p.mimeType,
    isHidden: p.isHidden,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    fileUrl: `/api/v1/progress/photos/${p.id}/file`,
  }));
}

export async function getPhotoFile(userId: string, photoId: string) {
  const [photo] = await db
    .select()
    .from(schema.transformationPhotos)
    .where(and(eq(schema.transformationPhotos.id, photoId), eq(schema.transformationPhotos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new Error("Photo not found or access denied.");
  }

  const absolutePath = path.join(STORAGE_ROOT, photo.storagePath);
  if (!existsSync(absolutePath)) {
    throw new Error("Photo file missing from storage.");
  }

  const buffer = await fs.readFile(absolutePath);
  return {
    buffer,
    mimeType: photo.mimeType,
    fileName: photo.fileName,
  };
}

export async function deleteTransformationPhoto(userId: string, photoId: string) {
  const [photo] = await db
    .select()
    .from(schema.transformationPhotos)
    .where(and(eq(schema.transformationPhotos.id, photoId), eq(schema.transformationPhotos.userId, userId)))
    .limit(1);

  if (!photo) {
    throw new Error("Photo not found or access denied.");
  }

  // Delete file from disk
  const absolutePath = path.join(STORAGE_ROOT, photo.storagePath);
  try {
    if (existsSync(absolutePath)) {
      await fs.unlink(absolutePath);
    }
  } catch (err) {
    console.error("Failed to delete physical photo file:", err);
  }

  // Delete DB record
  const [deleted] = await db
    .delete(schema.transformationPhotos)
    .where(eq(schema.transformationPhotos.id, photoId))
    .returning();

  return deleted;
}

// -----------------------------------------------------------------------------
// 6. GOAL PROGRESS & MILESTONES ENGINE
// -----------------------------------------------------------------------------

export async function evaluateAndSyncMilestones(userId: string) {
  const weightData = await getWeightHistory(userId);
  const measurementData = await getBodyMeasurements(userId);

  // Retrieve user workouts count
  const workouts = await db
    .select()
    .from(schema.workoutSessions)
    .where(and(eq(schema.workoutSessions.userId, userId), eq(schema.workoutSessions.status, "completed")));

  // Retrieve personal records count
  const prs = await db
    .select()
    .from(schema.personalRecords)
    .where(eq(schema.personalRecords.userId, userId));

  // Retrieve food logs count
  const foodLogs = await db
    .select()
    .from(schema.dailyFoodLogs)
    .where(eq(schema.dailyFoodLogs.userId, userId));

  // Pre-defined milestone definitions
  const standardMilestones = [
    {
      key: "first_workout",
      category: "workout",
      titleEn: "First Workout Completed",
      titleUr: "پہلی ورزش مکمل",
      descriptionEn: "Completed your first official workout session",
      descriptionUr: "اپنا پہلا باقاعدہ تربیتی سیشن مکمل کیا",
      targetValue: 1,
      currentValue: workouts.length,
      unit: "workouts",
      isAchieved: workouts.length >= 1,
    },
    {
      key: "workout_10",
      category: "workout",
      titleEn: "10 Workouts Consistency",
      titleUr: "10 ورزشوں کا سنگ میل",
      descriptionEn: "Reached 10 completed workout sessions",
      descriptionUr: "10 مکمل ورزشی سیشنز کا ہدف حاصل کیا",
      targetValue: 10,
      currentValue: workouts.length,
      unit: "workouts",
      isAchieved: workouts.length >= 10,
    },
    {
      key: "first_pr",
      category: "workout",
      titleEn: "Personal Record Broken",
      titleUr: "ذاتی ریکارڈ قائم",
      descriptionEn: "Achieved your first strength personal record",
      descriptionUr: "اپنی طاقت کا پہلا ذاتی ریکارڈ حاصل کیا",
      targetValue: 1,
      currentValue: prs.length,
      unit: "records",
      isAchieved: prs.length >= 1,
    },
    {
      key: "first_5kg_loss",
      category: "weight",
      titleEn: "First 5 kg Weight Loss",
      titleUr: "پہلے 5 کلوگرام وزن میں کمی",
      descriptionEn: "Lost 5 kilograms from your starting weight",
      descriptionUr: "ابتدائی وزن سے 5 کلوگرام کم کیے",
      targetValue: 5,
      currentValue: weightData.netChangeKg < 0 ? Math.abs(weightData.netChangeKg) : 0,
      unit: "kg",
      isAchieved: weightData.netChangeKg <= -5,
    },
    {
      key: "first_2kg_gain",
      category: "weight",
      titleEn: "First 2 kg Muscle/Weight Gain",
      titleUr: "پہلے 2 کلوگرام وزن میں اضافہ",
      descriptionEn: "Gained 2 kilograms toward your muscle building target",
      descriptionUr: "اپنے عضلاتی ہدف کی جانب 2 کلوگرام حاصل کیے",
      targetValue: 2,
      currentValue: weightData.netChangeKg > 0 ? weightData.netChangeKg : 0,
      unit: "kg",
      isAchieved: weightData.netChangeKg >= 2,
    },
    {
      key: "target_weight_reached",
      category: "weight",
      titleEn: "Target Weight Achieved",
      titleUr: "ہدف وزن حاصل کر لیا",
      descriptionEn: "Successfully reached your goal target weight",
      descriptionUr: "کامیابی کے ساتھ اپنے مطلوبہ وزن کا ہدف پا لیا",
      targetValue: weightData.targetWeightKg || 0,
      currentValue: weightData.currentWeightKg || 0,
      unit: "kg",
      isAchieved: weightData.isGoalReached && weightData.targetWeightKg !== null,
    },
    {
      key: "nutrition_streak_7d",
      category: "nutrition",
      titleEn: "7-Day Nutrition Tracker",
      titleUr: "7 دن کی خوراک ٹریکنگ",
      descriptionEn: "Logged food diary for at least 7 days",
      descriptionUr: "کم از کم 7 دن روزانہ خوراک ریکارڈ کی",
      targetValue: 7,
      currentValue: foodLogs.length,
      unit: "days",
      isAchieved: foodLogs.length >= 7,
    },
  ];

  for (const m of standardMilestones) {
    const [existing] = await db
      .select()
      .from(schema.progressMilestones)
      .where(and(eq(schema.progressMilestones.userId, userId), eq(schema.progressMilestones.milestoneKey, m.key)))
      .limit(1);

    if (existing) {
      if (!existing.isAchieved && m.isAchieved) {
        await db
          .update(schema.progressMilestones)
          .set({
            isAchieved: true,
            achievedAt: new Date(),
            currentValue: m.currentValue,
          })
          .where(eq(schema.progressMilestones.id, existing.id));
      } else {
        await db
          .update(schema.progressMilestones)
          .set({
            currentValue: m.currentValue,
          })
          .where(eq(schema.progressMilestones.id, existing.id));
      }
    } else {
      await db.insert(schema.progressMilestones).values({
        userId,
        category: m.category,
        milestoneKey: m.key,
        titleEn: m.titleEn,
        titleUr: m.titleUr,
        descriptionEn: m.descriptionEn,
        descriptionUr: m.descriptionUr,
        targetValue: m.targetValue,
        currentValue: m.currentValue,
        unit: m.unit,
        isAchieved: m.isAchieved,
        achievedAt: m.isAchieved ? new Date() : null,
      });
    }
  }
}

export async function getMilestones(userId: string) {
  await evaluateAndSyncMilestones(userId);

  const list = await db
    .select()
    .from(schema.progressMilestones)
    .where(eq(schema.progressMilestones.userId, userId))
    .orderBy(desc(schema.progressMilestones.isAchieved), desc(schema.progressMilestones.createdAt));

  return list;
}

export async function createCustomMilestone(
  userId: string,
  data: {
    category: string;
    titleEn: string;
    titleUr: string;
    descriptionEn?: string;
    descriptionUr?: string;
    targetValue?: number;
    currentValue?: number;
    unit?: string;
    isAchieved?: boolean;
  }
) {
  let isAchieved = data.isAchieved ?? false;
  if (data.isAchieved === undefined && data.targetValue !== undefined && data.currentValue !== undefined) {
    if (data.category === "weight" || data.category === "measurement") {
      isAchieved = data.currentValue <= data.targetValue || data.currentValue >= data.targetValue;
    } else {
      isAchieved = data.currentValue >= data.targetValue;
    }
  }

  const [created] = await db
    .insert(schema.progressMilestones)
    .values({
      userId,
      category: data.category || "custom",
      milestoneKey: `custom_${Date.now()}`,
      titleEn: data.titleEn,
      titleUr: data.titleUr,
      descriptionEn: data.descriptionEn || null,
      descriptionUr: data.descriptionUr || null,
      targetValue: data.targetValue ?? null,
      currentValue: data.currentValue ?? 0,
      unit: data.unit || null,
      isAchieved,
      achievedAt: isAchieved ? new Date() : null,
    })
    .returning();

  return created;
}

// -----------------------------------------------------------------------------
// 7. PROGRESS REPORTS & CSV EXPORT
// -----------------------------------------------------------------------------

export async function generateProgressReport(
  userId: string,
  periodType: "7_days" | "30_days" | "90_days" | "custom" = "30_days",
  customStart?: Date,
  customEnd?: Date
) {
  let startDate = new Date();
  const endDate = customEnd ? new Date(customEnd) : new Date();
  endDate.setHours(23, 59, 59, 999);

  if (periodType === "7_days") startDate.setDate(endDate.getDate() - 7);
  else if (periodType === "30_days") startDate.setDate(endDate.getDate() - 30);
  else if (periodType === "90_days") startDate.setDate(endDate.getDate() - 90);
  else if (periodType === "custom" && customStart) startDate = new Date(customStart);

  startDate.setHours(0, 0, 0, 0);

  // Retrieve weights in period
  const weights = await db
    .select()
    .from(schema.bodyMeasurementHistory)
    .where(
      and(
        eq(schema.bodyMeasurementHistory.userId, userId),
        gte(schema.bodyMeasurementHistory.recordedAt, startDate),
        lte(schema.bodyMeasurementHistory.recordedAt, endDate)
      )
    )
    .orderBy(asc(schema.bodyMeasurementHistory.recordedAt));

  const startWeight = weights[0]?.weight ?? null;
  const endWeight = weights[weights.length - 1]?.weight ?? null;
  const weightChangeKg = startWeight !== null && endWeight !== null ? Math.round((endWeight - startWeight) * 10) / 10 : 0;

  // Retrieve measurements in period
  const measurements = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(
      and(
        eq(schema.bodyMeasurements.userId, userId),
        gte(schema.bodyMeasurements.recordedAt, startDate),
        lte(schema.bodyMeasurements.recordedAt, endDate)
      )
    )
    .orderBy(asc(schema.bodyMeasurements.recordedAt));

  const firstM = measurements[0];
  const lastM = measurements[measurements.length - 1];

  const measurementChanges = {
    waistChangeCm: firstM?.waistCm && lastM?.waistCm ? Math.round((lastM.waistCm - firstM.waistCm) * 10) / 10 : null,
    chestChangeCm: firstM?.chestCm && lastM?.chestCm ? Math.round((lastM.chestCm - firstM.chestCm) * 10) / 10 : null,
    armChangeCm: firstM?.armCm && lastM?.armCm ? Math.round((lastM.armCm - firstM.armCm) * 10) / 10 : null,
    hipChangeCm: firstM?.hipCm && lastM?.hipCm ? Math.round((lastM.hipCm - firstM.hipCm) * 10) / 10 : null,
  };

  // Retrieve workouts in period
  const workouts = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        gte(schema.workoutSessions.startTime, startDate),
        lte(schema.workoutSessions.startTime, endDate)
      )
    );

  const totalVolumeKg = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

  // Retrieve nutrition in period
  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];
  const nutrition = await db
    .select()
    .from(schema.dailyFoodLogs)
    .where(
      and(
        eq(schema.dailyFoodLogs.userId, userId),
        gte(schema.dailyFoodLogs.logDate, startStr),
        lte(schema.dailyFoodLogs.logDate, endStr)
      )
    );

  const avgCalories = nutrition.length > 0 ? Math.round(nutrition.reduce((s, n) => s + n.totalCalories, 0) / nutrition.length) : null;
  const avgProtein = nutrition.length > 0 ? Math.round((nutrition.reduce((s, n) => s + n.totalProteinGrams, 0) / nutrition.length) * 10) / 10 : null;

  // Retrieve user milestones
  const milestones = await db
    .select()
    .from(schema.progressMilestones)
    .where(and(eq(schema.progressMilestones.userId, userId), eq(schema.progressMilestones.isAchieved, true)));

  return {
    periodType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    weight: {
      startWeightKg: startWeight,
      endWeightKg: endWeight,
      weightChangeKg,
      totalEntries: weights.length,
    },
    measurements: {
      ...measurementChanges,
      totalEntries: measurements.length,
    },
    workouts: {
      totalCompleted: workouts.length,
      totalVolumeKg: Math.round(totalVolumeKg),
    },
    nutrition: {
      loggedDays: nutrition.length,
      avgCalories,
      avgProtein,
    },
    achievedMilestones: milestones.map((m) => ({
      titleEn: m.titleEn,
      titleUr: m.titleUr,
      achievedAt: m.achievedAt?.toISOString(),
    })),
  };
}

export async function exportProgressDataCsv(userId: string) {
  // 1. Fetch weight history
  const weights = await db
    .select()
    .from(schema.bodyMeasurementHistory)
    .where(eq(schema.bodyMeasurementHistory.userId, userId))
    .orderBy(asc(schema.bodyMeasurementHistory.recordedAt));

  // 2. Fetch measurements
  const measurements = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(eq(schema.bodyMeasurements.userId, userId))
    .orderBy(asc(schema.bodyMeasurements.recordedAt));

  // 3. Fetch workouts
  const workouts = await db
    .select()
    .from(schema.workoutSessions)
    .where(eq(schema.workoutSessions.userId, userId))
    .orderBy(asc(schema.workoutSessions.startTime));

  // 4. Fetch nutrition logs
  const nutrition = await db
    .select()
    .from(schema.dailyFoodLogs)
    .where(eq(schema.dailyFoodLogs.userId, userId))
    .orderBy(asc(schema.dailyFoodLogs.logDate));

  let csv = "=== FITLIFE AI PROGRESS DATA EXPORT ===\n\n";

  // Section 1: Weight History
  csv += "--- WEIGHT HISTORY ---\n";
  csv += "Date,Weight (kg),Weight (lbs),Source,Notes\n";
  for (const w of weights) {
    csv += `"${w.recordedAt.toISOString().split("T")[0]}",${Math.round(w.weight * 10) / 10},${kgToLbs(w.weight)},"${w.source}","${(w.notes || "").replace(/"/g, '""')}"\n`;
  }

  // Section 2: Body Measurements
  csv += "\n--- BODY MEASUREMENTS (cm) ---\n";
  csv += "Date,Waist,Chest,Hips,Neck,Arms,Forearms,Thighs,Calves,Body Fat %\n";
  for (const m of measurements) {
    csv += `"${m.recordedAt.toISOString().split("T")[0]}",${m.waistCm || ""},${m.chestCm || ""},${m.hipCm || ""},${m.neckCm || ""},${m.armCm || ""},${m.forearmCm || ""},${m.thighCm || ""},${m.calfCm || ""},${m.bodyFatPercentage || ""}\n`;
  }

  // Section 3: Workouts
  csv += "\n--- WORKOUT SESSIONS ---\n";
  csv += "Date,Status,Duration (min),Volume (kg),Rating\n";
  for (const wk of workouts) {
    const mins = wk.durationSeconds ? Math.round(wk.durationSeconds / 60) : 0;
    csv += `"${wk.startTime.toISOString().split("T")[0]}","${wk.status}",${mins},${Math.round(wk.totalVolumeKg || 0)},${wk.rating || ""}\n`;
  }

  // Section 4: Daily Nutrition
  csv += "\n--- DAILY NUTRITION ---\n";
  csv += "Date,Calories,Target Calories,Protein (g),Carbs (g),Fat (g)\n";
  for (const n of nutrition) {
    csv += `"${n.logDate}",${Math.round(n.totalCalories)},${Math.round(n.targetCalories)},${Math.round(n.totalProteinGrams * 10) / 10},${Math.round(n.totalCarbsGrams * 10) / 10},${Math.round(n.totalFatGrams * 10) / 10}\n`;
  }

  return csv;
}
