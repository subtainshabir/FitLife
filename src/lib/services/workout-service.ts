import { db } from "@/db";
import {
  workoutRoutines,
  routineExercises,
  workoutSchedules,
  workoutSessions,
  sessionExercises,
  sessionSets,
  personalRecords,
  exercises,
  type WorkoutRoutine,
  type RoutineExercise,
  type WorkoutSession,
  type SessionExercise,
  type SessionSet,
  type PersonalRecord,
} from "@/db/schema";
import { eq, and, desc, gte, inArray, sql } from "drizzle-orm";

// ============================================================================
// 1. DETERMINISTIC VOLUME & STATS CALCULATIONS
// ============================================================================

/**
 * Calculates volume for a single set.
 * Standard resistance training: Volume = weight (kg) * repetitions.
 * Bodyweight movements (weightKg = 0):
 *   Biomechanical load is ~65% of bodyweight (e.g. for push-ups, squats, pull-ups).
 *   If user weight is unknown, defaults to 65kg reference bodyweight.
 */
export function calculateSetVolume(
  weightKg: number,
  repsCompleted: number,
  isBodyweight: boolean = false,
  userBodyweightKg?: number
): number {
  if (repsCompleted <= 0) return 0;

  if (weightKg > 0) {
    return Math.round(weightKg * repsCompleted * 10) / 10;
  }

  if (isBodyweight) {
    const effectiveBodyweight = (userBodyweightKg && userBodyweightKg > 0 ? userBodyweightKg : 65) * 0.65;
    return Math.round(effectiveBodyweight * repsCompleted * 10) / 10;
  }

  // Pure rep count fallback
  return repsCompleted;
}

/**
 * Aggregates all completed sets in a session to compute total volume, reps, and sets.
 */
export function calculateSessionSummary(
  sets: Array<{
    weightKg: number;
    repsCompleted: number;
    isCompleted: boolean;
    isWarmup?: boolean;
    durationSeconds?: number | null;
    isBodyweight?: boolean;
  }>,
  userBodyweightKg?: number
) {
  let totalVolumeKg = 0;
  let totalSetsCompleted = 0;
  let totalRepsCompleted = 0;

  for (const s of sets) {
    if (!s.isCompleted) continue;
    totalSetsCompleted += 1;
    totalRepsCompleted += s.repsCompleted || 0;

    const setVol = calculateSetVolume(
      s.weightKg || 0,
      s.repsCompleted || 0,
      s.isBodyweight || false,
      userBodyweightKg
    );
    totalVolumeKg += setVol;
  }

  return {
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    totalSetsCompleted,
    totalRepsCompleted,
  };
}

// ============================================================================
// 2. PERSONAL RECORDS (PR) DETECTION ENGINE
// ============================================================================

export interface NewRecordAchieved {
  recordType: "max_weight" | "max_reps" | "max_volume" | "max_duration";
  exerciseId: string;
  value: number;
  previousValue: number | null;
  metricLabel: string;
}

/**
 * Compares current exercise session performance against existing PRs and saves any new records.
 */
export async function evaluateAndSavePersonalRecords(
  userId: string,
  exerciseId: string,
  completedSets: Array<{
    weightKg: number;
    repsCompleted: number;
    durationSeconds?: number | null;
    isWarmup?: boolean;
    isCompleted: boolean;
    isBodyweight?: boolean;
  }>,
  sessionId?: string,
  userBodyweightKg?: number
): Promise<NewRecordAchieved[]> {
  const workingSets = completedSets.filter((s) => s.isCompleted && !s.isWarmup);
  if (workingSets.length === 0) return [];

  // Calculate session peaks for this exercise
  let maxWeight = 0;
  let maxReps = 0;
  let maxDuration = 0;
  let totalExVolume = 0;

  for (const s of workingSets) {
    if (s.weightKg > maxWeight) maxWeight = s.weightKg;
    if (s.repsCompleted > maxReps) maxReps = s.repsCompleted;
    if (s.durationSeconds && s.durationSeconds > maxDuration) maxDuration = s.durationSeconds;

    totalExVolume += calculateSetVolume(
      s.weightKg,
      s.repsCompleted,
      s.isBodyweight || false,
      userBodyweightKg
    );
  }
  totalExVolume = Math.round(totalExVolume * 10) / 10;

  // Retrieve existing PRs for this user & exercise
  const existingPRs = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, userId),
        eq(personalRecords.exerciseId, exerciseId)
      )
    );

  const prMap = new Map<string, PersonalRecord>();
  for (const pr of existingPRs) {
    prMap.set(pr.recordType, pr);
  }

  const newRecords: NewRecordAchieved[] = [];

  // Check Max Weight (only if weight > 0)
  if (maxWeight > 0) {
    const existing = prMap.get("max_weight");
    if (!existing || maxWeight > existing.value) {
      const prevVal = existing ? existing.value : null;
      if (existing) {
        await db
          .update(personalRecords)
          .set({
            value: maxWeight,
            previousValue: prevVal,
            sessionId: sessionId || null,
            achievedAt: new Date(),
          })
          .where(eq(personalRecords.id, existing.id));
      } else {
        await db.insert(personalRecords).values({
          userId,
          exerciseId,
          recordType: "max_weight",
          value: maxWeight,
          previousValue: null,
          sessionId: sessionId || null,
          achievedAt: new Date(),
        });
      }
      newRecords.push({
        recordType: "max_weight",
        exerciseId,
        value: maxWeight,
        previousValue: prevVal,
        metricLabel: `${maxWeight} kg`,
      });
    }
  }

  // Check Max Reps in a single set
  if (maxReps > 0) {
    const existing = prMap.get("max_reps");
    if (!existing || maxReps > existing.value) {
      const prevVal = existing ? existing.value : null;
      if (existing) {
        await db
          .update(personalRecords)
          .set({
            value: maxReps,
            previousValue: prevVal,
            sessionId: sessionId || null,
            achievedAt: new Date(),
          })
          .where(eq(personalRecords.id, existing.id));
      } else {
        await db.insert(personalRecords).values({
          userId,
          exerciseId,
          recordType: "max_reps",
          value: maxReps,
          previousValue: null,
          sessionId: sessionId || null,
          achievedAt: new Date(),
        });
      }
      newRecords.push({
        recordType: "max_reps",
        exerciseId,
        value: maxReps,
        previousValue: prevVal,
        metricLabel: `${maxReps} reps`,
      });
    }
  }

  // Check Max Total Volume in a single session
  if (totalExVolume > 0) {
    const existing = prMap.get("max_volume");
    if (!existing || totalExVolume > existing.value) {
      const prevVal = existing ? existing.value : null;
      if (existing) {
        await db
          .update(personalRecords)
          .set({
            value: totalExVolume,
            previousValue: prevVal,
            sessionId: sessionId || null,
            achievedAt: new Date(),
          })
          .where(eq(personalRecords.id, existing.id));
      } else {
        await db.insert(personalRecords).values({
          userId,
          exerciseId,
          recordType: "max_volume",
          value: totalExVolume,
          previousValue: null,
          sessionId: sessionId || null,
          achievedAt: new Date(),
        });
      }
      newRecords.push({
        recordType: "max_volume",
        exerciseId,
        value: totalExVolume,
        previousValue: prevVal,
        metricLabel: `${totalExVolume} kg total volume`,
      });
    }
  }

  // Check Max Duration (e.g. plank hold time)
  if (maxDuration > 0) {
    const existing = prMap.get("max_duration");
    if (!existing || maxDuration > existing.value) {
      const prevVal = existing ? existing.value : null;
      if (existing) {
        await db
          .update(personalRecords)
          .set({
            value: maxDuration,
            previousValue: prevVal,
            sessionId: sessionId || null,
            achievedAt: new Date(),
          })
          .where(eq(personalRecords.id, existing.id));
      } else {
        await db.insert(personalRecords).values({
          userId,
          exerciseId,
          recordType: "max_duration",
          value: maxDuration,
          previousValue: null,
          sessionId: sessionId || null,
          achievedAt: new Date(),
        });
      }
      newRecords.push({
        recordType: "max_duration",
        exerciseId,
        value: maxDuration,
        previousValue: prevVal,
        metricLabel: `${maxDuration}s hold time`,
      });
    }
  }

  return newRecords;
}

// ============================================================================
// 3. PROGRESSIVE OVERLOAD RECOMMENDATION ADVICE
// ============================================================================

export interface ProgressiveOverloadAdvice {
  action: "increase_weight" | "increase_reps" | "maintain" | "deload";
  suggestedWeightKg?: number;
  suggestedRepsMin?: number;
  suggestedRepsMax?: number;
  headlineEn: string;
  headlineUr: string;
  rationaleEn: string;
  rationaleUr: string;
  confidence: "high" | "moderate";
}

/**
 * Determines evidence-based, conservative progressive overload recommendations.
 *
 * Rules:
 * - If user achieved the upper target rep count across all working sets (e.g. 12 reps on 3x8-12):
 *   Upper body: +2.5 kg next session
 *   Lower body: +5.0 kg next session
 *   Bodyweight: +2 target reps or +1 set
 * - If user completed between targetRepsMin and targetRepsMax:
 *   Maintain weight and aim for +1 rep per set.
 * - If user completed below targetRepsMin on majority of sets:
 *   Maintain current load and reinforce movement quality, or deload -5% if RPE was high (>= 9.5).
 */
export function evaluateProgressiveOverload(params: {
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeightKg: number;
  primaryMuscle: string;
  isBodyweight: boolean;
  loggedSets: Array<{
    weightKg: number;
    repsCompleted: number;
    isCompleted: boolean;
    isWarmup?: boolean;
    rpe?: number | null;
  }>;
}): ProgressiveOverloadAdvice {
  const workingSets = params.loggedSets.filter((s) => s.isCompleted && !s.isWarmup);

  if (workingSets.length === 0) {
    return {
      action: "maintain",
      suggestedWeightKg: params.targetWeightKg,
      suggestedRepsMin: params.targetRepsMin,
      suggestedRepsMax: params.targetRepsMax,
      headlineEn: "Establish Baseline Performance",
      headlineUr: "بنیادی کارکردگی قائم کریں",
      rationaleEn: "Complete your assigned sets at the target weight to unlock progression recommendations.",
      rationaleUr: "ترقی کی رہنمائی کے لیے مقررہ وزن پر تمام سیٹ مکمل کریں۔",
      confidence: "high",
    };
  }

  const isLowerBody = [
    "quadriceps",
    "hamstrings",
    "glutes",
    "calves",
  ].includes(params.primaryMuscle.toLowerCase());

  const allHitMaxReps = workingSets.every((s) => s.repsCompleted >= params.targetRepsMax);
  const avgReps =
    workingSets.reduce((sum, s) => sum + s.repsCompleted, 0) / workingSets.length;
  const currentWeight = Math.max(...workingSets.map((s) => s.weightKg), params.targetWeightKg);

  if (allHitMaxReps) {
    if (params.isBodyweight && currentWeight === 0) {
      const nextMin = params.targetRepsMin + 2;
      const nextMax = params.targetRepsMax + 2;
      return {
        action: "increase_reps",
        suggestedWeightKg: 0,
        suggestedRepsMin: nextMin,
        suggestedRepsMax: nextMax,
        headlineEn: "Increase Repetition Target (+2 Reps)",
        headlineUr: "ریپیٹیشنز کا ہدف بڑھائیں (+2 ریپس)",
        rationaleEn: `You completed the maximum ${params.targetRepsMax} reps on all working sets! Increase your target range to ${nextMin}–${nextMax} reps to continue stimulating muscular adaptation.`,
        rationaleUr: `آپ نے تمام سیٹوں میں زیادہ سے زیادہ ${params.targetRepsMax} ریپس کامیابی سے لگائے! پٹھوں کی نشوونما کے لیے ہدف ${nextMin}–${nextMax} ریپس تک بڑھائیں۔`,
        confidence: "high",
      };
    } else {
      const increment = isLowerBody ? 5.0 : 2.5;
      const nextWeight = Math.round((currentWeight + increment) * 10) / 10;
      return {
        action: "increase_weight",
        suggestedWeightKg: nextWeight,
        suggestedRepsMin: params.targetRepsMin,
        suggestedRepsMax: params.targetRepsMax,
        headlineEn: `Add +${increment} kg Weight Load`,
        headlineUr: `وزن میں +${increment} کلوگرام اضافہ کریں`,
        rationaleEn: `Target reps reached across all sets (${params.targetRepsMax} reps). Safely advance your resistance to ${nextWeight} kg while resetting to ${params.targetRepsMin} reps.`,
        rationaleUr: `تمام سیٹوں پر ہدف پورا ہوا (${params.targetRepsMax} ریپس)۔ محفوظ طریقے سے وزن ${nextWeight} کلوگرام کر دیں اور ریپس دوبارہ ${params.targetRepsMin} سے شروع کریں۔`,
        confidence: "high",
      };
    }
  }

  if (avgReps < params.targetRepsMin) {
    const highExertion = workingSets.some((s) => (s.rpe || 0) >= 9.5);
    if (highExertion && currentWeight > 10) {
      const deloadWeight = Math.round(currentWeight * 0.9 * 2) / 2; // -10% rounded to 0.5kg
      return {
        action: "deload",
        suggestedWeightKg: deloadWeight,
        suggestedRepsMin: params.targetRepsMin,
        suggestedRepsMax: params.targetRepsMax,
        headlineEn: "Tactical Deload (-10% Weight)",
        headlineUr: "تکنیکی وزن میں کمی (-10% وزن)",
        rationaleEn: `Repetitions dropped below ${params.targetRepsMin} with high muscular strain. Reduce load to ${deloadWeight} kg to build volume and refine execution.`,
        rationaleUr: `پٹھوں پر زیادہ دباؤ کی وجہ سے ریپس ${params.targetRepsMin} سے کم رہے۔ فارم بہتر بنانے کے لیے وزن ${deloadWeight} کلوگرام پر لائیں۔`,
        confidence: "moderate",
      };
    }

    return {
      action: "maintain",
      suggestedWeightKg: currentWeight,
      suggestedRepsMin: params.targetRepsMin,
      suggestedRepsMax: params.targetRepsMax,
      headlineEn: "Consolidate Current Weight",
      headlineUr: "موجودہ وزن پر مضبوطی حاصل کریں",
      rationaleEn: `Maintain ${currentWeight} kg. Focus on strict form and full range of motion until you consistently reach ${params.targetRepsMin} reps on every set.`,
      rationaleUr: `وزن ${currentWeight} کلوگرام ہی رکھیں۔ جب تک ہر سیٹ میں کم از کم ${params.targetRepsMin} ریپس مکمل نہ ہوں، وزن نہ بڑھائیں۔`,
      confidence: "high",
    };
  }

  // User is within min and max reps
  return {
    action: "increase_reps",
    suggestedWeightKg: currentWeight,
    suggestedRepsMin: params.targetRepsMin,
    suggestedRepsMax: params.targetRepsMax,
    headlineEn: "Aim for +1 Extra Rep Next Session",
    headlineUr: "اگلی بار ہر سیٹ میں +1 اضافی ریپ کا ہدف رکھیں",
    rationaleEn: `Great work logging an average of ${Math.round(avgReps)} reps at ${currentWeight} kg. Strive for 1 additional repetition per set before adding more weight.`,
    rationaleUr: `بہترین کوشش! ${currentWeight} کلوگرام پر اوسطاً ${Math.round(avgReps)} ریپس لگائے۔ اگلی بار ہر سیٹ میں 1 اضافی ریپ لگانے کی کوشش کریں۔`,
    confidence: "high",
  };
}

// ============================================================================
// 4. RECOVERY-AWARE MUSCLE OVERLAP CHECKER (< 48 HOURS)
// ============================================================================

export interface MuscleRecoveryStatus {
  hasFatiguedMuscles: boolean;
  fatiguedMuscles: Array<{
    muscle: string;
    hoursSinceTrained: number;
    sessionName: string;
    completedAt: Date;
  }>;
  warningEn?: string;
  warningUr?: string;
}

/**
 * Checks if any of the target muscle groups have been intensively trained within the past 48 hours.
 */
export async function checkMuscleRecovery(
  userId: string,
  targetMuscleGroups: string[]
): Promise<MuscleRecoveryStatus> {
  if (targetMuscleGroups.length === 0) {
    return { hasFatiguedMuscles: false, fatiguedMuscles: [] };
  }

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Retrieve sessions completed within the last 48 hours
  const recentSessions = await db
    .select({
      sessionId: workoutSessions.id,
      sessionName: workoutSessions.name,
      endTime: workoutSessions.endTime,
      createdAt: workoutSessions.createdAt,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.createdAt, fortyEightHoursAgo)
      )
    )
    .orderBy(desc(workoutSessions.createdAt));

  if (recentSessions.length === 0) {
    return { hasFatiguedMuscles: false, fatiguedMuscles: [] };
  }

  const recentSessionIds = recentSessions.map((s) => s.sessionId);

  // Retrieve exercises performed in those sessions
  const performedExercises = await db
    .select({
      sessionId: sessionExercises.sessionId,
      primaryMuscle: exercises.primaryMuscle,
      secondaryMuscles: exercises.secondaryMuscles,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(
      and(
        inArray(sessionExercises.sessionId, recentSessionIds),
        eq(sessionExercises.isSkipped, false)
      )
    );

  const normalizedTargets = new Set(targetMuscleGroups.map((m) => m.toLowerCase()));
  const fatiguedMap = new Map<
    string,
    {
      muscle: string;
      hoursSinceTrained: number;
      sessionName: string;
      completedAt: Date;
    }
  >();

  for (const pe of performedExercises) {
    const parentSession = recentSessions.find((s) => s.sessionId === pe.sessionId);
    if (!parentSession) continue;

    const completedAt = parentSession.endTime || parentSession.createdAt;
    const hoursSince = Math.round(((Date.now() - completedAt.getTime()) / (1000 * 60 * 60)) * 10) / 10;

    const musclesInExercise = [
      pe.primaryMuscle.toLowerCase(),
      ...((pe.secondaryMuscles as string[]) || []).map((m) => m.toLowerCase()),
    ];

    for (const m of musclesInExercise) {
      if (normalizedTargets.has(m)) {
        if (!fatiguedMap.has(m) || fatiguedMap.get(m)!.hoursSinceTrained > hoursSince) {
          fatiguedMap.set(m, {
            muscle: m,
            hoursSinceTrained: hoursSince,
            sessionName: parentSession.sessionName,
            completedAt,
          });
        }
      }
    }
  }

  const fatiguedMuscles = Array.from(fatiguedMap.values());

  if (fatiguedMuscles.length === 0) {
    return { hasFatiguedMuscles: false, fatiguedMuscles: [] };
  }

  const muscleNames = fatiguedMuscles.map((f) => f.muscle.replace("_", " ")).join(", ");
  const minHours = Math.min(...fatiguedMuscles.map((f) => f.hoursSinceTrained));

  const warningEn = `Recovery Notice: You trained (${muscleNames}) ${minHours} hours ago. Optimal muscle hypertrophy and protein synthesis typically require 48 hours of recovery before intense loading. You may proceed if feeling recovered, or switch to an opposing muscle group.`;
  const warningUr = `بحالی کا مشورہ: آپ نے (${muscleNames}) ${minHours} گھنٹے پہلے ٹرین کیے۔ پٹھوں کی مکمل نشوونما اور مرمت کے لیے عام طور پر 48 گھنٹے آرام درکار ہوتا ہے۔ اگر آپ بہتر محسوس کر رہے ہیں تو جاری رکھ سکتے ہیں یا دوسرے پٹھوں کی ورزش منتخب کریں۔`;

  return {
    hasFatiguedMuscles: true,
    fatiguedMuscles,
    warningEn,
    warningUr,
  };
}

// ============================================================================
// 5. PRE-BUILT VERIFIED ROUTINE TEMPLATES
// ============================================================================

export interface SeedRoutineTemplate {
  name: string;
  nameUr: string;
  description: string;
  descriptionUr: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  targetDurationMinutes: number;
  splitType: "full_body" | "upper_lower" | "push_pull_legs" | "body_part" | "cardio_core" | "custom";
  tags: string[];
  exercises: Array<{
    exerciseSlug: string;
    orderIndex: number;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    targetWeightKg: number;
    targetDurationSeconds?: number;
    restSeconds: number;
    notes?: string;
  }>;
}

export const STARTER_ROUTINE_TEMPLATES: SeedRoutineTemplate[] = [
  {
    name: "Full Body Foundations",
    nameUr: "مکمل جسم کی بنیادی ورزش",
    description: "A balanced 3-day full body strength foundation focusing on major compound movements for balanced muscle growth and strength.",
    descriptionUr: "مکمل جسمانی طاقت اور پٹھوں کی متوازن نشوونما کے لیے 3 روزہ بنیادی ورزش۔",
    difficulty: "beginner",
    targetDurationMinutes: 45,
    splitType: "full_body",
    tags: ["strength", "full_body", "beginner", "compound"],
    exercises: [
      {
        exerciseSlug: "barbell-squats",
        orderIndex: 0,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: 40,
        restSeconds: 90,
        notes: "Keep chest proud and drive up through mid-foot.",
      },
      {
        exerciseSlug: "barbell-bench-press",
        orderIndex: 1,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        targetWeightKg: 40,
        restSeconds: 90,
        notes: "Control the eccentric descent down to sternum.",
      },
      {
        exerciseSlug: "one-arm-dumbbell-row",
        orderIndex: 2,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetWeightKg: 14,
        restSeconds: 60,
        notes: "Pull elbow to hip without rotating torso.",
      },
      {
        exerciseSlug: "dumbbell-shoulder-press",
        orderIndex: 3,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetWeightKg: 12,
        restSeconds: 60,
        notes: "Press directly overhead without arching lower back.",
      },
      {
        exerciseSlug: "standard-plank",
        orderIndex: 4,
        targetSets: 3,
        targetRepsMin: 1,
        targetRepsMax: 1,
        targetWeightKg: 0,
        targetDurationSeconds: 45,
        restSeconds: 60,
        notes: "Lock core, brace glutes and avoid sagging hips.",
      },
    ],
  },
  {
    name: "Upper Body Hypertrophy",
    nameUr: "اوپری جسم کی نشوونما",
    description: "Targeted upper body workout stimulating chest, back, shoulders, biceps, and triceps with optimal progressive volume.",
    descriptionUr: "سینے، کمر، کندھوں اور بازوؤں کے لیے مؤثر اوپری جسم کی ورزش۔",
    difficulty: "intermediate",
    targetDurationMinutes: 50,
    splitType: "upper_lower",
    tags: ["hypertrophy", "upper_body", "intermediate", "muscle_building"],
    exercises: [
      {
        exerciseSlug: "incline-dumbbell-press",
        orderIndex: 0,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        targetWeightKg: 18,
        restSeconds: 90,
        notes: "Focus on upper chest contraction at top.",
      },
      {
        exerciseSlug: "lat-pulldown",
        orderIndex: 1,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetWeightKg: 45,
        restSeconds: 75,
        notes: "Drive elbows down to engage latissimus dorsi.",
      },
      {
        exerciseSlug: "dumbbell-lateral-raises",
        orderIndex: 2,
        targetSets: 4,
        targetRepsMin: 12,
        targetRepsMax: 15,
        targetWeightKg: 8,
        restSeconds: 60,
        notes: "Lead with elbows for lateral deltoid isolation.",
      },
      {
        exerciseSlug: "dumbbell-bicep-curl",
        orderIndex: 3,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetWeightKg: 12,
        restSeconds: 60,
        notes: "Supinate wrist at peak contraction.",
      },
      {
        exerciseSlug: "tricep-pushdown",
        orderIndex: 4,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 15,
        targetWeightKg: 20,
        restSeconds: 60,
        notes: "Lock elbows by side and fully extend triceps.",
      },
    ],
  },
  {
    name: "Lower Body & Posterior Chain Power",
    nameUr: "نچلے جسم اور ٹانگوں کی طاقت",
    description: "Complete lower body workout targeting quadriceps, hamstrings, glutes, and calves with heavy compound and isolation movements.",
    descriptionUr: "رانوں، کولہوں اور پنڈلیوں کی مکمل طاقت اور مضبوطی کے لیے نچلے جسم کی ورزش۔",
    difficulty: "intermediate",
    targetDurationMinutes: 50,
    splitType: "upper_lower",
    tags: ["lower_body", "legs", "strength", "intermediate"],
    exercises: [
      {
        exerciseSlug: "barbell-squats",
        orderIndex: 0,
        targetSets: 4,
        targetRepsMin: 6,
        targetRepsMax: 8,
        targetWeightKg: 60,
        restSeconds: 120,
        notes: "Deep squat depth to parallel or below.",
      },
      {
        exerciseSlug: "romanian-deadlift",
        orderIndex: 1,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: 50,
        restSeconds: 90,
        notes: "Hinge at hips feeling intense hamstring stretch.",
      },
      {
        exerciseSlug: "walking-lunges",
        orderIndex: 2,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetWeightKg: 12,
        restSeconds: 75,
        notes: "Step forward keeping 90-degree bend in front knee.",
      },
      {
        exerciseSlug: "standing-calf-raises",
        orderIndex: 3,
        targetSets: 4,
        targetRepsMin: 12,
        targetRepsMax: 15,
        targetWeightKg: 16,
        restSeconds: 60,
        notes: "Pause for 2 seconds at the top stretch.",
      },
    ],
  },
  {
    name: "Home Calisthenics & Core Burn",
    nameUr: "گھریلو جسمانی ورزش اور کور",
    description: "High-yield zero-equipment bodyweight training combining upper body push/pull endurance with active core conditioning.",
    descriptionUr: "بغیر کسی سامان کے گھر پر جسمانی وزن سے فٹنس اور پیٹ کی چربی کم کرنے والی ورزش۔",
    difficulty: "beginner",
    targetDurationMinutes: 35,
    splitType: "cardio_core",
    tags: ["home", "bodyweight", "no_equipment", "calisthenics", "fat_loss"],
    exercises: [
      {
        exerciseSlug: "push-ups",
        orderIndex: 0,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 15,
        targetWeightKg: 0,
        restSeconds: 60,
        notes: "Elbows at 45 degrees, full depth to floor.",
      },
      {
        exerciseSlug: "floor-crunches",
        orderIndex: 1,
        targetSets: 3,
        targetRepsMin: 15,
        targetRepsMax: 20,
        targetWeightKg: 0,
        restSeconds: 45,
        notes: "Contract abdominals and exhale on elevation.",
      },
      {
        exerciseSlug: "lying-leg-raises",
        orderIndex: 2,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 15,
        targetWeightKg: 0,
        restSeconds: 45,
        notes: "Press lower back firmly into floor.",
      },
      {
        exerciseSlug: "bicycle-crunches",
        orderIndex: 3,
        targetSets: 3,
        targetRepsMin: 12,
        targetRepsMax: 16,
        targetWeightKg: 0,
        restSeconds: 45,
        notes: "Rotate torso smoothly targeting obliques.",
      },
      {
        exerciseSlug: "jumping-jacks",
        orderIndex: 4,
        targetSets: 3,
        targetRepsMin: 30,
        targetRepsMax: 40,
        targetWeightKg: 0,
        restSeconds: 45,
        notes: "Light footwork to elevate cardiovascular rate.",
      },
    ],
  },
];

