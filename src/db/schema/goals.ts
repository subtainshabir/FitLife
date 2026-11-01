import { pgTable, text, timestamp, uuid, doublePrecision, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const fitnessGoals = pgTable(
  "fitness_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalType: text("goal_type").notNull(), // e.g. weight_loss, muscle_building, weight_gain, fat_reduction, weight_maintenance, body_recomposition, strength_improvement, endurance, general_fitness
    currentWeight: doublePrecision("current_weight"), // in kg
    targetWeight: doublePrecision("target_weight"), // in kg
    targetRate: doublePrecision("target_rate"), // in kg/week (e.g. 0.25, 0.5, 0.75, 1.0)
    startDate: timestamp("start_date", { withTimezone: true }).defaultNow().notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }),
    status: text("status").default("in_progress").notNull(), // in_progress, completed, paused, abandoned
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("fitness_goals_user_id_idx").on(table.userId),
    statusIdx: index("fitness_goals_status_idx").on(table.status),
  })
);

export type FitnessGoal = typeof fitnessGoals.$inferSelect;
export type NewFitnessGoal = typeof fitnessGoals.$inferInsert;

