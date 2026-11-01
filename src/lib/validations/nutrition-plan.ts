import { z } from "zod";
import { FITNESS_GOALS } from "./profile";

export const generateNutritionPlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  goal: z.string().default("muscle_building"),
  targetCalories: z.number().min(1000).max(7000),
  targetProteinGrams: z.number().min(30).max(400),
  targetCarbsGrams: z.number().min(30).max(800),
  targetFatGrams: z.number().min(20).max(250),
  targetFibreGrams: z.number().min(5).max(100).default(25),
  dailyBudget: z.number().min(100).max(50000), // in PKR
  budgetPeriod: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  currency: z.string().default("PKR"),
  city: z.string().default("Rawalpindi"),
  mealsPerDay: z.number().int().min(3).max(6).default(4),
  cookingTimeMinutes: z.number().int().min(10).max(180).default(30),
  dietaryType: z.enum(["standard", "halal", "high_protein", "low_carb", "vegetarian"]).default("standard"),
  excludedFoods: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  dietaryRestrictions: z.array(z.string()).default(["halal"]),
  preferredFoods: z.array(z.string()).default([]),
  planDays: z.number().int().min(1).max(7).default(1),
  useAi: z.boolean().default(true),
});

export type GenerateNutritionPlanInput = z.input<typeof generateNutritionPlanSchema>;
export type GenerateNutritionPlanOutput = z.infer<typeof generateNutritionPlanSchema>;

export const regenerateMealSchema = z.object({
  mealId: z.string().uuid(),
  customNotes: z.string().max(300).optional(),
  preference: z.enum(["balanced", "cheaper", "higher_protein", "quick_prep"]).default("balanced"),
});

export type RegenerateMealInput = z.infer<typeof regenerateMealSchema>;

export const substituteFoodSchema = z.object({
  mealId: z.string().uuid(),
  mealFoodItemId: z.string().uuid(),
  substituteFoodItemId: z.string().uuid().optional(),
  strategy: z.enum(["cheaper", "higher_protein", "similar_macros", "any"]).default("cheaper"),
});

export type SubstituteFoodInput = z.infer<typeof substituteFoodSchema>;

export const updateGroceryItemSchema = z.object({
  isPurchased: z.boolean().optional(),
  totalQuantity: z.number().min(0.01).optional(),
  notes: z.string().max(200).optional(),
});

export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemSchema>;

export const updateNutritionPlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
});

export type UpdateNutritionPlanInput = z.infer<typeof updateNutritionPlanSchema>;

