import { z } from "zod";

// 1. Routine Exercise Input
export const routineExerciseInputSchema = z.object({
  id: z.string().uuid().optional(),
  exerciseId: z.string().uuid({ message: "Valid exercise ID is required" }),
  orderIndex: z.coerce.number().int().min(0).default(0),
  targetSets: z.coerce.number().int().min(1, "At least 1 set").max(20, "Max 20 sets").default(3),
  targetRepsMin: z.coerce.number().int().min(1).max(100).default(8),
  targetRepsMax: z.coerce.number().int().min(1).max(100).default(12),
  targetWeightKg: z.coerce.number().min(0).max(500).default(0),
  targetDurationSeconds: z.coerce.number().int().min(1).max(3600).optional().nullable(),
  restSeconds: z.coerce.number().int().min(10, "Minimum 10s rest").max(600, "Max 10m rest").default(60),
  notes: z.string().max(500).optional().nullable(),
  notesUr: z.string().max(500).optional().nullable(),
});

export type RoutineExerciseInput = z.infer<typeof routineExerciseInputSchema>;

// 2. Create Workout Routine
export const createRoutineSchema = z.object({
  name: z.string().min(2, "Routine name must be at least 2 characters").max(100),
  nameUr: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  descriptionUr: z.string().max(500).optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  targetDurationMinutes: z.coerce.number().int().min(5).max(300).default(45),
  splitType: z
    .enum(["full_body", "upper_lower", "push_pull_legs", "body_part", "cardio_core", "custom"])
    .default("full_body"),
  tags: z.array(z.string().max(30)).default([]),
  isTemplate: z.boolean().default(false),
  exercises: z.array(routineExerciseInputSchema).min(1, "Routine must include at least one exercise"),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;

// 3. Update Workout Routine
export const updateRoutineSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nameUr: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  descriptionUr: z.string().max(500).optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  targetDurationMinutes: z.coerce.number().int().min(5).max(300).optional(),
  splitType: z
    .enum(["full_body", "upper_lower", "push_pull_legs", "body_part", "cardio_core", "custom"])
    .optional(),
  tags: z.array(z.string().max(30)).optional(),
  isTemplate: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  exercises: z.array(routineExerciseInputSchema).optional(),
});

export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;

// 4. Schedule Workout Day
export const scheduleWorkoutSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6), // 0 = Sun ... 6 = Sat
  routineId: z.string().uuid().optional().nullable(),
  isRestDay: z.boolean().default(false),
  scheduledTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM 24h format")
    .default("08:00"),
  notes: z.string().max(300).optional().nullable(),
});

export type ScheduleWorkoutInput = z.infer<typeof scheduleWorkoutSchema>;

export const bulkScheduleSchema = z.object({
  schedules: z.array(scheduleWorkoutSchema).min(1).max(7),
});

export type BulkScheduleInput = z.infer<typeof bulkScheduleSchema>;

// 5. Start Workout Session
export const startSessionSchema = z.object({
  routineId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Session name is required").max(100),
  exerciseIds: z.array(z.string().uuid()).optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

// 6. Log Session Set
export const logSetSchema = z.object({
  sessionExerciseId: z.string().uuid(),
  setNumber: z.coerce.number().int().min(1).max(50),
  isWarmup: z.boolean().default(false),
  weightKg: z.coerce.number().min(0).max(600).default(0),
  repsCompleted: z.coerce.number().int().min(0).max(200).default(0),
  durationSeconds: z.coerce.number().int().min(0).max(3600).optional().nullable(),
  isCompleted: z.boolean().default(true),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
});

export type LogSetInput = z.infer<typeof logSetSchema>;

// 7. Update Session Set
export const updateSetSchema = z.object({
  weightKg: z.coerce.number().min(0).max(600).optional(),
  repsCompleted: z.coerce.number().int().min(0).max(200).optional(),
  durationSeconds: z.coerce.number().int().min(0).max(3600).optional().nullable(),
  isCompleted: z.boolean().optional(),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
});

export type UpdateSetInput = z.infer<typeof updateSetSchema>;

// 8. Complete Workout Session
export const completeSessionSchema = z.object({
  durationSeconds: z.coerce.number().int().min(0).default(0),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  perceivedExertionRpe: z.coerce.number().min(1).max(10).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;

// 9. Substitute Exercise
export const substituteExerciseSchema = z.object({
  sessionExerciseId: z.string().uuid(),
  replacementExerciseId: z.string().uuid(),
  notes: z.string().max(300).optional().nullable(),
});

export type SubstituteExerciseInput = z.infer<typeof substituteExerciseSchema>;

// 10. Skip Exercise
export const skipExerciseSchema = z.object({
  sessionExerciseId: z.string().uuid(),
  isSkipped: z.boolean().default(true),
  notes: z.string().max(300).optional().nullable(),
});

export type SkipExerciseInput = z.infer<typeof skipExerciseSchema>;

