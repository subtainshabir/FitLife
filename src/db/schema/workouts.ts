import {
  pgTable,
  text,
  timestamp,
  uuid,
  doublePrecision,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { exercises } from "./exercises";

// 1. Workout Routines
export const workoutRoutines = pgTable(
  "workout_routines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // nullable for system templates
    name: text("name").notNull(),
    nameUr: text("name_ur"),
    description: text("description"),
    descriptionUr: text("description_ur"),
    difficulty: text("difficulty").default("beginner").notNull(), // beginner, intermediate, advanced
    targetDurationMinutes: integer("target_duration_minutes").default(45).notNull(),
    splitType: text("split_type").default("full_body").notNull(), // full_body, upper_lower, push_pull_legs, body_part, cardio_core, custom
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    isTemplate: boolean("is_template").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("workout_routines_user_id_idx").on(table.userId),
    isTemplateIdx: index("workout_routines_is_template_idx").on(table.isTemplate),
    splitTypeIdx: index("workout_routines_split_type_idx").on(table.splitType),
    difficultyIdx: index("workout_routines_difficulty_idx").on(table.difficulty),
  })
);

export type WorkoutRoutine = typeof workoutRoutines.$inferSelect;
export type NewWorkoutRoutine = typeof workoutRoutines.$inferInsert;

// 2. Routine Exercises (junction table linking Routine to Exercises with targets)
export const routineExercises = pgTable(
  "routine_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => workoutRoutines.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").default(0).notNull(),
    targetSets: integer("target_sets").default(3).notNull(),
    targetRepsMin: integer("target_reps_min").default(8).notNull(),
    targetRepsMax: integer("target_reps_max").default(12).notNull(),
    targetWeightKg: doublePrecision("target_weight_kg").default(0).notNull(),
    targetDurationSeconds: integer("target_duration_seconds"), // For isometric holds like planks
    restSeconds: integer("rest_seconds").default(60).notNull(),
    notes: text("notes"),
    notesUr: text("notes_ur"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    routineIdIdx: index("routine_exercises_routine_id_idx").on(table.routineId),
    exerciseIdIdx: index("routine_exercises_exercise_id_idx").on(table.exerciseId),
    orderIdx: index("routine_exercises_order_idx").on(table.routineId, table.orderIndex),
  })
);

export type RoutineExercise = typeof routineExercises.$inferSelect;
export type NewRoutineExercise = typeof routineExercises.$inferInsert;

// 3. Weekly Workout Schedules
export const workoutSchedules = pgTable(
  "workout_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    routineId: uuid("routine_id").references(() => workoutRoutines.id, { onDelete: "set null" }), // nullable for Rest Day
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    isRestDay: boolean("is_rest_day").default(false).notNull(),
    scheduledTime: text("scheduled_time").default("08:00").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDayIdx: uniqueIndex("workout_schedules_user_day_idx").on(table.userId, table.dayOfWeek),
    userIdIdx: index("workout_schedules_user_id_idx").on(table.userId),
  })
);

export type WorkoutSchedule = typeof workoutSchedules.$inferSelect;
export type NewWorkoutSchedule = typeof workoutSchedules.$inferInsert;

// 4. Workout Sessions (Actual executed or active workout instance)
export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    routineId: uuid("routine_id").references(() => workoutRoutines.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    status: text("status").default("in_progress").notNull(), // in_progress, completed, cancelled
    startTime: timestamp("start_time", { withTimezone: true }).defaultNow().notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    totalVolumeKg: doublePrecision("total_volume_kg").default(0).notNull(),
    totalSetsCompleted: integer("total_sets_completed").default(0).notNull(),
    totalRepsCompleted: integer("total_reps_completed").default(0).notNull(),
    estimatedCaloriesBurned: doublePrecision("estimated_calories_burned").default(0).notNull(),
    rating: integer("rating"), // 1-5
    perceivedExertionRpe: doublePrecision("perceived_exertion_rpe"), // 1-10
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("workout_sessions_user_id_idx").on(table.userId),
    statusIdx: index("workout_sessions_status_idx").on(table.status),
    startTimeIdx: index("workout_sessions_start_time_idx").on(table.startTime),
  })
);

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;

// 5. Session Exercises (Exercises included in a specific workout session)
export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").default(0).notNull(),
    isSkipped: boolean("is_skipped").default(false).notNull(),
    replacedWithExerciseId: uuid("replaced_with_exercise_id").references(() => exercises.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index("session_exercises_session_id_idx").on(table.sessionId),
    exerciseIdIdx: index("session_exercises_exercise_id_idx").on(table.exerciseId),
  })
);

export type SessionExercise = typeof sessionExercises.$inferSelect;
export type NewSessionExercise = typeof sessionExercises.$inferInsert;

// 6. Session Sets (Individual logged sets for an exercise in a session)
export const sessionSets = pgTable(
  "session_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionExerciseId: uuid("session_exercise_id")
      .notNull()
      .references(() => sessionExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    isWarmup: boolean("is_warmup").default(false).notNull(),
    weightKg: doublePrecision("weight_kg").default(0).notNull(),
    repsCompleted: integer("reps_completed").default(0).notNull(),
    durationSeconds: integer("duration_seconds"), // for timed holds
    isCompleted: boolean("is_completed").default(false).notNull(),
    rpe: doublePrecision("rpe"), // Rate of Perceived Exertion (1 to 10)
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sessionExerciseIdIdx: index("session_sets_session_exercise_id_idx").on(table.sessionExerciseId),
  })
);

export type SessionSet = typeof sessionSets.$inferSelect;
export type NewSessionSet = typeof sessionSets.$inferInsert;

// 7. Personal Records (PRs) per user and exercise
export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    recordType: text("record_type").notNull(), // 'max_weight', 'max_reps', 'max_volume', 'max_duration'
    value: doublePrecision("value").notNull(),
    previousValue: doublePrecision("previous_value"),
    sessionId: uuid("session_id").references(() => workoutSessions.id, { onDelete: "set null" }),
    achievedAt: timestamp("achieved_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userExerciseIdx: index("personal_records_user_exercise_idx").on(table.userId, table.exerciseId),
    recordTypeIdx: index("personal_records_record_type_idx").on(table.recordType),
  })
);

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type NewPersonalRecord = typeof personalRecords.$inferInsert;

// Drizzle Relations
export const workoutRoutinesRelations = relations(workoutRoutines, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutRoutines.userId],
    references: [users.id],
  }),
  exercises: many(routineExercises),
  schedules: many(workoutSchedules),
  sessions: many(workoutSessions),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(workoutRoutines, {
    fields: [routineExercises.routineId],
    references: [workoutRoutines.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const workoutSchedulesRelations = relations(workoutSchedules, ({ one }) => ({
  user: one(users, {
    fields: [workoutSchedules.userId],
    references: [users.id],
  }),
  routine: one(workoutRoutines, {
    fields: [workoutSchedules.routineId],
    references: [workoutRoutines.id],
  }),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSessions.userId],
    references: [users.id],
  }),
  routine: one(workoutRoutines, {
    fields: [workoutSessions.routineId],
    references: [workoutRoutines.id],
  }),
  exercises: many(sessionExercises),
  personalRecords: many(personalRecords),
}));

export const sessionExercisesRelations = relations(sessionExercises, ({ one, many }) => ({
  session: one(workoutSessions, {
    fields: [sessionExercises.sessionId],
    references: [workoutSessions.id],
  }),
  exercise: one(exercises, {
    fields: [sessionExercises.exerciseId],
    references: [exercises.id],
  }),
  replacedWithExercise: one(exercises, {
    fields: [sessionExercises.replacedWithExerciseId],
    references: [exercises.id],
  }),
  sets: many(sessionSets),
}));

export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  sessionExercise: one(sessionExercises, {
    fields: [sessionSets.sessionExerciseId],
    references: [sessionExercises.id],
  }),
}));

export const personalRecordsRelations = relations(personalRecords, ({ one }) => ({
  user: one(users, {
    fields: [personalRecords.userId],
    references: [users.id],
  }),
  exercise: one(exercises, {
    fields: [personalRecords.exerciseId],
    references: [exercises.id],
  }),
  session: one(workoutSessions, {
    fields: [personalRecords.sessionId],
    references: [workoutSessions.id],
  }),
}));

