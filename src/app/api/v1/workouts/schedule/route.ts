import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workoutSchedules, workoutRoutines, routineExercises } from "@/db/schema";
import { scheduleWorkoutSchema, bulkScheduleSchema } from "@/lib/validations/workout";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch user schedule with linked routine
    const schedules = await db
      .select({
        schedule: workoutSchedules,
        routine: workoutRoutines,
      })
      .from(workoutSchedules)
      .leftJoin(workoutRoutines, eq(workoutSchedules.routineId, workoutRoutines.id))
      .where(eq(workoutSchedules.userId, userId))
      .orderBy(asc(workoutSchedules.dayOfWeek));

    // Construct full 7-day array
    const dayNames = [
      { dayOfWeek: 0, en: "Sunday", ur: "اتوار" },
      { dayOfWeek: 1, en: "Monday", ur: "پیر" },
      { dayOfWeek: 2, en: "Tuesday", ur: "منگل" },
      { dayOfWeek: 3, en: "Wednesday", ur: "بدھ" },
      { dayOfWeek: 4, en: "Thursday", ur: "جمعرات" },
      { dayOfWeek: 5, en: "Friday", ur: "جمعہ" },
      { dayOfWeek: 6, en: "Saturday", ur: "ہفتہ" },
    ];

    const fullWeek = dayNames.map((d) => {
      const match = schedules.find((s) => s.schedule.dayOfWeek === d.dayOfWeek);
      if (match) {
        return {
          id: match.schedule.id,
          dayOfWeek: d.dayOfWeek,
          dayNameEn: d.en,
          dayNameUr: d.ur,
          isRestDay: match.schedule.isRestDay,
          scheduledTime: match.schedule.scheduledTime,
          notes: match.schedule.notes,
          routineId: match.schedule.routineId,
          routine: match.routine
            ? {
                id: match.routine.id,
                name: match.routine.name,
                nameUr: match.routine.nameUr,
                difficulty: match.routine.difficulty,
                splitType: match.routine.splitType,
                targetDurationMinutes: match.routine.targetDurationMinutes,
              }
            : null,
        };
      }

      // Default unconfigured day
      return {
        id: null,
        dayOfWeek: d.dayOfWeek,
        dayNameEn: d.en,
        dayNameUr: d.ur,
        isRestDay: true, // Default to rest day until user assigns routine
        scheduledTime: "08:00",
        notes: null,
        routineId: null,
        routine: null,
      };
    });

    return NextResponse.json({
      success: true,
      data: fullWeek,
    });
  } catch (error: any) {
    console.error("GET /api/v1/workouts/schedule error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule", details: error.message },
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

    // Check if bulk or single
    let itemsToUpsert: Array<{
      dayOfWeek: number;
      routineId?: string | null;
      isRestDay: boolean;
      scheduledTime?: string;
      notes?: string | null;
    }> = [];

    if (body.schedules && Array.isArray(body.schedules)) {
      const parsedBulk = bulkScheduleSchema.safeParse(body);
      if (!parsedBulk.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsedBulk.error.format() },
          { status: 400 }
        );
      }
      itemsToUpsert = parsedBulk.data.schedules;
    } else {
      const parsedSingle = scheduleWorkoutSchema.safeParse(body);
      if (!parsedSingle.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsedSingle.error.format() },
          { status: 400 }
        );
      }
      itemsToUpsert = [parsedSingle.data];
    }

    // Upsert each day for user
    const results = [];
    for (const item of itemsToUpsert) {
      const [existing] = await db
        .select()
        .from(workoutSchedules)
        .where(
          and(
            eq(workoutSchedules.userId, userId),
            eq(workoutSchedules.dayOfWeek, item.dayOfWeek)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(workoutSchedules)
          .set({
            routineId: item.isRestDay ? null : item.routineId || null,
            isRestDay: item.isRestDay,
            scheduledTime: item.scheduledTime || "08:00",
            notes: item.notes || null,
            updatedAt: new Date(),
          })
          .where(eq(workoutSchedules.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db
          .insert(workoutSchedules)
          .values({
            userId,
            dayOfWeek: item.dayOfWeek,
            routineId: item.isRestDay ? null : item.routineId || null,
            isRestDay: item.isRestDay,
            scheduledTime: item.scheduledTime || "08:00",
            notes: item.notes || null,
          })
          .returning();
        results.push(inserted);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully",
      data: results,
    });
  } catch (error: any) {
    console.error("POST /api/v1/workouts/schedule error:", error);
    return NextResponse.json(
      { error: "Failed to update schedule", details: error.message },
      { status: 500 }
    );
  }
}

