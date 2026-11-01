import { z } from "zod";
import { ACTIVITY_LEVELS, FITNESS_EXPERIENCES, FITNESS_GOALS, GENDERS } from "./profile";

export const assessmentCalculationSchema = z.object({
  age: z
    .coerce
    .number({ invalid_type_error: "Age must be a valid number" })
    .int("Age must be an integer")
    .min(10, "Age must be at least 10 years")
    .max(120, "Age must be 120 or under"),
  height: z
    .coerce
    .number({ invalid_type_error: "Height must be a valid number" })
    .min(50, "Height must be at least 50 cm (or equivalent)")
    .max(300, "Height must be 300 cm or under"),
  weight: z
    .coerce
    .number({ invalid_type_error: "Weight must be a valid number" })
    .min(20, "Weight must be at least 20 kg (or equivalent)")
    .max(500, "Weight must be 500 kg or under"),
  unit: z.enum(["metric", "imperial"]).default("metric"),
  gender: z.enum(GENDERS).optional().default("prefer_not_to_say"),
  activityLevel: z.enum(ACTIVITY_LEVELS, {
    errorMap: () => ({ message: "Please select a valid activity level" }),
  }),
  fitnessExperience: z.enum(FITNESS_EXPERIENCES).optional().default("beginner"),
  primaryGoal: z.enum(FITNESS_GOALS, {
    errorMap: () => ({ message: "Please select a valid fitness goal" }),
  }),
  healthConditions: z.array(z.string()).default([]),
  isPregnant: z.boolean().default(false),
  saveToProfile: z.boolean().default(true),
});

export type AssessmentCalculationInput = z.infer<typeof assessmentCalculationSchema>;

