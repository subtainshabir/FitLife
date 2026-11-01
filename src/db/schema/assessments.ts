import { pgTable, text, timestamp, uuid, doublePrecision, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const bodyAssessments = pgTable(
  "body_assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    age: integer("age").notNull(),
    gender: text("gender"), // biological sex for formula: male, female, other, prefer_not_to_say
    height: doublePrecision("height").notNull(), // in cm
    weight: doublePrecision("weight").notNull(), // in kg
    activityLevel: text("activity_level").notNull(), // sedentary, lightly_active, moderately_active, very_active, extra_active
    fitnessExperience: text("fitness_experience"), // beginner, intermediate, advanced
    primaryGoal: text("primary_goal").notNull(), // fitness goal
    bmi: doublePrecision("bmi").notNull(),
    bmiCategory: text("bmi_category").notNull(), // underweight, normal, overweight, obese_1, obese_2, obese_3, pediatric_minor
    bmr: doublePrecision("bmr").notNull(), // kcal/day via Mifflin-St Jeor
    tdee: doublePrecision("tdee").notNull(), // kcal/day
    targetCalories: doublePrecision("target_calories").notNull(), // daily calorie target
    targetProteinGrams: doublePrecision("target_protein_grams").notNull(),
    targetCarbsGrams: doublePrecision("target_carbs_grams").notNull(),
    targetFatGrams: doublePrecision("target_fat_grams").notNull(),
    isMinor: boolean("is_minor").default(false).notNull(),
    hasHealthWarning: boolean("has_health_warning").default(false).notNull(),
    calculationNotes: jsonb("calculation_notes").$type<Record<string, unknown>>().default({}).notNull(),
    healthNotes: text("health_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("body_assessments_user_id_idx").on(table.userId),
    createdAtIdx: index("body_assessments_created_at_idx").on(table.createdAt),
  })
);

export type BodyAssessment = typeof bodyAssessments.$inferSelect;
export type NewBodyAssessment = typeof bodyAssessments.$inferInsert;

