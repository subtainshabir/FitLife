import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  workoutSessions,
  sessionExercises,
  sessionSets,
  exercises,
  workoutSchedules,
  personalRecords,
} from "@/db/schema";
import { eq, and, desc, asc, gte, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. Fetch all completed sessions for user
    const sessionsList = await db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, "completed")
        )
      )
      .orderBy(asc(workoutSessions.startTime));

    // Calculate totals
    const totalWorkouts = sessionsList.length;
    let totalVolumeKg = 0;
    let totalReps = 0;
    let totalSets = 0;
    let totalDurationSeconds = 0;
    let totalCalories = 0;

    for (const s of sessionsList) {
      totalVolumeKg += s.totalVolumeKg || 0;
      totalReps += s.totalRepsCompleted || 0;
      totalSets += s.totalSetsCompleted || 0;
      totalDurationSeconds += s.durationSeconds || 0;
      totalCalories += s.estimatedCaloriesBurned || 0;
    }

    const avgDurationMins =
      totalWorkouts > 0 ? Math.round(totalDurationSeconds / totalWorkouts / 60) : 0;

    // 2. Volume Progression Timeline (last 15 completed sessions)
    const recentSessionsForTimeline = sessionsList.slice(-15);
    const volumeTimeline = recentSessionsForTimeline.map((s) => ({
      date: new Date(s.startTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: s.startTime,
      sessionName: s.name,
      volumeKg: Math.round(s.totalVolumeKg || 0),
      durationMinutes: Math.round((s.durationSeconds || 0) / 60),
      setsCount: s.totalSetsCompleted || 0,
    }));

    // 3. Weekly Frequency & Consistency (Last 4 weeks)
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const recentFourWeeksSessions = sessionsList.filter(
      (s) => new Date(s.startTime) >= fourWeeksAgo
    );

    // Get user's weekly target from schedule
    const userSchedules = await db
      .select()
      .from(workoutSchedules)
      .where(and(eq(workoutSchedules.userId, userId), eq(workoutSchedules.isRestDay, false)));
    const targetPerWeek = userSchedules.length > 0 ? userSchedules.length : 3;

    // Group into 4 distinct weeks
    const weeklyFrequency = [3, 2, 1, 0].map((weeksAgo) => {
      const start = new Date(Date.now() - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
      const count = recentFourWeeksSessions.filter((s) => {
        const d = new Date(s.startTime);
        return d >= start && d < end;
      }).length;

      const label = weeksAgo === 0 ? "This Week" : `${weeksAgo}w ago`;

      return {
        label,
        count,
        target: targetPerWeek,
        completionRate: Math.min(100, Math.round((count / targetPerWeek) * 100)),
      };
    });

    // 4. Muscle Group Distribution (sets completed across all sessions)
    const sessionIds = sessionsList.map((s) => s.id);
    const muscleDistributionMap: Record<string, number> = {};

    if (sessionIds.length > 0) {
      const performedSets = await db
        .select({
          primaryMuscle: exercises.primaryMuscle,
          isCompleted: sessionSets.isCompleted,
        })
        .from(sessionSets)
        .innerJoin(
          sessionExercises,
          eq(sessionSets.sessionExerciseId, sessionExercises.id)
        )
        .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
        .where(
          and(
            inArray(sessionExercises.sessionId, sessionIds),
            eq(sessionSets.isCompleted, true),
            eq(sessionExercises.isSkipped, false)
          )
        );

      for (const ps of performedSets) {
        const m = ps.primaryMuscle || "other";
        muscleDistributionMap[m] = (muscleDistributionMap[m] || 0) + 1;
      }
    }

    const muscleDistribution = Object.entries(muscleDistributionMap)
      .map(([muscle, setCount]) => ({
        muscle: muscle.replace("_", " "),
        rawMuscle: muscle,
        setCount,
        percentage: totalSets > 0 ? Math.round((setCount / totalSets) * 100) : 0,
      }))
      .sort((a, b) => b.setCount - a.setCount);

    // 5. Total PRs achieved count
    const totalPrs = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(personalRecords)
      .where(eq(personalRecords.userId, userId));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalWorkouts,
          totalVolumeKg: Math.round(totalVolumeKg),
          totalReps,
          totalSets,
          totalDurationMinutes: Math.round(totalDurationSeconds / 60),
          totalCaloriesBurned: totalCalories,
          averageSessionDurationMinutes: avgDurationMins,
          totalPersonalRecords: totalPrs[0]?.count || 0,
        },
        volumeTimeline,
        weeklyFrequency,
        muscleDistribution,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to compile analytics", details: error.message },
      { status: 500 }
    );
  }
}

