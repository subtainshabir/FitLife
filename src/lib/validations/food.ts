import { z } from "zod";

export const FOOD_TYPES = ["raw", "cooked", "prepared", "beverage", "pantry"] as const;
export const PRICE_VERIFICATION_STATUSES = ["verified", "unverified", "expired", "under_review"] as const;
export const PRICE_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export const calculateNutritionSchema = z.object({
  foodId: z.string().uuid("Invalid food ID format"),
  quantity: z
    .coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .positive("Quantity must be greater than zero"),
  unit: z.string().trim().min(1, "Serving unit is required"),
});

export const calculateBatchNutritionSchema = z.object({
  foods: z.array(calculateNutritionSchema).min(1, "At least one food item is required"),
});

export const calculateCostSchema = z.object({
  foodId: z.string().uuid("Invalid food ID format"),
  quantity: z
    .coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .positive("Quantity must be greater than zero"),
  unit: z.string().trim().min(1, "Serving unit is required"),
  city: z.string().trim().optional(),
  priceId: z.string().uuid().optional(),
});

export const foodSearchQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  foodType: z.enum(FOOD_TYPES).optional(),
  minProtein: z.coerce.number().optional(),
  maxCalories: z.coerce.number().optional(),
  city: z.string().trim().optional(),
  sortBy: z.enum(["name", "protein", "calories", "price"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createFoodItemSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID format"),
  nameEn: z.string().trim().min(2, "English name must be at least 2 characters").max(120),
  nameUr: z.string().trim().min(2, "Urdu name must be at least 2 characters").max(120),
  descriptionEn: z.string().trim().max(500).optional(),
  descriptionUr: z.string().trim().max(500).optional(),
  foodType: z.enum(FOOD_TYPES).default("raw"),
  defaultServingSize: z.coerce.number().positive().default(100),
  defaultServingUnit: z.string().trim().min(1).default("g"),
  servingWeightGrams: z.coerce.number().positive().default(100),
  caloriesPer100g: z.coerce.number().min(0, "Calories cannot be negative"),
  proteinPer100g: z.coerce.number().min(0, "Protein cannot be negative"),
  carbsPer100g: z.coerce.number().min(0, "Carbohydrates cannot be negative"),
  fatPer100g: z.coerce.number().min(0, "Fat cannot be negative"),
  fibrePer100g: z.coerce.number().min(0, "Fibre cannot be negative").default(0),
  nutritionSource: z.string().trim().min(3, "Nutrition source is required"),
  image: z.string().trim().url().optional().or(z.literal("")),
  isCommonPakistaniFood: z.boolean().default(true),
});

export const updateFoodItemSchema = createFoodItemSchema.partial();

export const createFoodPriceSchema = z.object({
  foodId: z.string().uuid("Invalid food ID format"),
  country: z.string().trim().default("Pakistan"),
  province: z.string().trim().min(2, "Province is required"),
  city: z.string().trim().min(2, "City is required"),
  marketRetailer: z.string().trim().min(2, "Market or retailer name is required"),
  price: z.coerce.number().positive("Price must be greater than zero"),
  quantity: z.coerce.number().positive().default(1),
  unit: z.string().trim().min(1, "Unit is required"), // kg, dozen, liter, g, etc.
  standardUnit: z.string().trim().default("kg"),
  currency: z.string().trim().default("PKR"),
  sourceId: z.string().uuid().optional(),
  verificationStatus: z.enum(PRICE_VERIFICATION_STATUSES).default("verified"),
  confidenceLevel: z.enum(PRICE_CONFIDENCE_LEVELS).default("high"),
  notes: z.string().trim().max(300).optional(),
});

export const updateFoodPriceSchema = createFoodPriceSchema.partial();

export type CalculateNutritionInput = z.infer<typeof calculateNutritionSchema>;
export type CalculateCostInput = z.infer<typeof calculateCostSchema>;
export type FoodSearchQuery = z.infer<typeof foodSearchQuerySchema>;
export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type CreateFoodPriceInput = z.infer<typeof createFoodPriceSchema>;

