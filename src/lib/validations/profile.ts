import { z } from "zod";

export const FITNESS_GOALS = [
  "weight_gain",
  "weight_loss",
  "muscle_building",
  "fat_reduction",
  "weight_maintenance",
  "body_recomposition",
  "strength_improvement",
  "endurance",
  "general_fitness",
] as const;

export const ACTIVITY_LEVELS = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "extra_active",
] as const;

export const FITNESS_EXPERIENCES = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export const GENDERS = [
  "male",
  "female",
  "non_binary",
  "other",
  "prefer_not_to_say",
] as const;

export const LANGUAGES = ["en", "ur"] as const;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date in YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  gender: z.enum(GENDERS).optional().or(z.literal("")),
  height: z
    .coerce
    .number()
    .min(50, "Height must be at least 50 cm")
    .max(300, "Height must be under 300 cm")
    .optional(),
  currentWeight: z
    .coerce
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight must be under 500 kg")
    .optional(),
  country: z.string().trim().min(1, "Country is required").max(100).optional(),
  city: z.string().trim().min(1, "City is required").max(100).optional(),
  preferredCurrency: z.string().trim().min(1).default("USD"),
  preferredLanguage: z.enum(LANGUAGES).default("en"),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional(),
  fitnessExperience: z.enum(FITNESS_EXPERIENCES).optional(),
  fitnessGoal: z.enum(FITNESS_GOALS).optional(),
  availableEquipment: z.array(z.string()).default([]),
  dietaryPreferences: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  dietaryRestrictions: z.array(z.string()).default([]),
});

export const updateProfileSchema = profileSchema.partial();

export type ProfileInput = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

