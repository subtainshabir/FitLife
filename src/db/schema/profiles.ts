import { pgTable, text, timestamp, uuid, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  height: doublePrecision("height"), // in cm
  currentWeight: doublePrecision("current_weight"), // in kg
  country: text("country"),
  city: text("city"),
  preferredCurrency: text("preferred_currency").default("USD").notNull(),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  activityLevel: text("activity_level"),
  fitnessExperience: text("fitness_experience"),
  fitnessGoal: text("fitness_goal"),
  availableEquipment: jsonb("available_equipment").$type<string[]>().default([]).notNull(),
  dietaryPreferences: jsonb("dietary_preferences").$type<string[]>().default([]).notNull(),
  allergies: jsonb("allergies").$type<string[]>().default([]).notNull(),
  dietaryRestrictions: jsonb("dietary_restrictions").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

