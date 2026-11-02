import { z } from "zod";

// 1. Create Food Log Entry
export const createFoodLogEntrySchema = z.object({
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
    .optional(),
  foodItemId: z.string().uuid().optional().nullable(),
  mealCategory: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    errorMap: () => ({ message: "Meal category must be breakfast, lunch, dinner, or snack" }),
  }),
  foodNameEn: z.string().min(1, "Food name is required").max(100),
  foodNameUr: z.string().max(100).optional().nullable(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Serving unit is required").max(30),
  weightGrams: z.coerce.number().positive().optional(),
  plannedMealFoodItemId: z.string().uuid().optional().nullable(),
  isFromMealPlan: z.boolean().default(false),
  idempotencyKey: z.string().max(100).optional().nullable(),
});

export type CreateFoodLogEntryInput = z.infer<typeof createFoodLogEntrySchema>;

// 2. Update Food Log Entry
export const updateFoodLogEntrySchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than 0").optional(),
  unit: z.string().min(1).max(30).optional(),
  mealCategory: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
});

export type UpdateFoodLogEntryInput = z.infer<typeof updateFoodLogEntrySchema>;

// 3. Import Meal Plan
export const importMealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
  nutritionPlanId: z.string().uuid().optional().nullable(),
  mealPlanId: z.string().uuid().optional().nullable(),
  mealId: z.string().uuid().optional().nullable(),
  selectedFoodItemIds: z.array(z.string().uuid()).optional(),
  confirmConsumed: z.boolean().default(true),
});

export type ImportMealPlanInput = z.infer<typeof importMealPlanSchema>;

// 4. Water Logging
export const logWaterSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
    .optional(),
  amountMl: z.coerce
    .number()
    .int()
    .min(1, "Amount must be at least 1 ml")
    .max(10000, "Maximum 10,000 ml per log entry"),
});

export type LogWaterInput = z.infer<typeof logWaterSchema>;

// 5. Water Goal
export const updateWaterGoalSchema = z.object({
  dailyTargetMl: z.coerce
    .number()
    .int()
    .min(500, "Daily target must be at least 500 ml")
    .max(10000, "Maximum target is 10,000 ml"),
  containerSizeMl: z.coerce.number().int().min(50).max(3000).optional(),
});

export type UpdateWaterGoalInput = z.infer<typeof updateWaterGoalSchema>;

// 6. Favourite Food
export const favouriteFoodSchema = z.object({
  foodItemId: z.string().uuid({ message: "Valid foodItemId is required" }),
  customServingSize: z.coerce.number().positive().optional().nullable(),
  customServingUnit: z.string().max(30).optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
});

export type FavouriteFoodInput = z.infer<typeof favouriteFoodSchema>;

// 7. Saved Meal
export const savedMealSchema = z.object({
  name: z.string().min(1, "Meal name is required").max(100),
  nameUr: z.string().max(100).optional().nullable(),
  mealCategory: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("lunch"),
  items: z
    .array(
      z.object({
        foodItemId: z.string().uuid().optional().nullable(),
        nameEn: z.string().min(1),
        nameUr: z.string().optional().nullable(),
        quantity: z.coerce.number().positive("Quantity must be greater than 0"),
        unit: z.string().min(1),
      })
    )
    .min(1, "At least one food item is required"),
});

export type SavedMealInput = z.infer<typeof savedMealSchema>;

