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
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { foodItems } from "./foods";

// 1. User Nutrition Preferences
export const userNutritionPreferences = pgTable(
  "user_nutrition_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyBudget: doublePrecision("daily_budget").default(500).notNull(), // in PKR
    budgetPeriod: text("budget_period").default("daily").notNull(), // daily, weekly, monthly
    currency: text("currency").default("PKR").notNull(),
    city: text("city").default("Rawalpindi").notNull(), // Kotli, Rawalpindi, Islamabad, Lahore, Karachi, etc.
    mealsPerDay: integer("meals_per_day").default(4).notNull(), // 3 to 6 meals
    cookingTimeMinutes: integer("cooking_time_minutes").default(30).notNull(),
    dietaryType: text("dietary_type").default("standard").notNull(), // halal, high_protein, low_carb, vegetarian, standard
    preferredFoods: jsonb("preferred_foods").$type<string[]>().default([]).notNull(),
    excludedFoods: jsonb("excluded_foods").$type<string[]>().default([]).notNull(),
    allergies: jsonb("allergies").$type<string[]>().default([]).notNull(),
    dietaryRestrictions: jsonb("dietary_restrictions").$type<string[]>().default(["halal"]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_nutrition_pref_user_id_idx").on(table.userId),
  })
);

export type UserNutritionPreference = typeof userNutritionPreferences.$inferSelect;
export type NewUserNutritionPreference = typeof userNutritionPreferences.$inferInsert;

// 2. Nutrition Plans
export const nutritionPlans = pgTable(
  "nutrition_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Budget High-Protein Plan (Rawalpindi)"
    goal: text("goal").notNull(), // muscle_building, weight_loss, etc.
    targetCalories: doublePrecision("target_calories").notNull(),
    targetProteinGrams: doublePrecision("target_protein_grams").notNull(),
    targetCarbsGrams: doublePrecision("target_carbs_grams").notNull(),
    targetFatGrams: doublePrecision("target_fat_grams").notNull(),
    targetFibreGrams: doublePrecision("target_fibre_grams").default(25).notNull(),
    dailyBudget: doublePrecision("daily_budget").notNull(),
    budgetPeriod: text("budget_period").default("daily").notNull(),
    currency: text("currency").default("PKR").notNull(),
    city: text("city").default("Rawalpindi").notNull(),
    mealsPerDay: integer("meals_per_day").default(4).notNull(),
    status: text("status").default("active").notNull(), // active, completed, archived
    totalCalories: doublePrecision("total_calories").default(0).notNull(),
    totalProteinGrams: doublePrecision("total_protein_grams").default(0).notNull(),
    totalCarbsGrams: doublePrecision("total_carbs_grams").default(0).notNull(),
    totalFatGrams: doublePrecision("total_fat_grams").default(0).notNull(),
    totalFibreGrams: doublePrecision("total_fibre_grams").default(0).notNull(),
    totalDailyCostPkr: doublePrecision("total_daily_cost_pkr").default(0).notNull(),
    isBudgetExceeded: boolean("is_budget_exceeded").default(false).notNull(),
    aiNotes: text("ai_notes"),
    aiModel: text("ai_model").default("deterministic_engine"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("nutrition_plans_user_id_idx").on(table.userId),
    statusIdx: index("nutrition_plans_status_idx").on(table.status),
    createdAtIdx: index("nutrition_plans_created_at_idx").on(table.createdAt),
  })
);

export type NutritionPlan = typeof nutritionPlans.$inferSelect;
export type NewNutritionPlan = typeof nutritionPlans.$inferInsert;

// 3. Meal Plans (Daily Schedule)
export const mealPlans = pgTable(
  "meal_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nutritionPlanId: uuid("nutrition_plan_id")
      .notNull()
      .references(() => nutritionPlans.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").default(1).notNull(),
    dayName: text("day_name").default("Daily Routine").notNull(),
    totalCalories: doublePrecision("total_calories").default(0).notNull(),
    totalProteinGrams: doublePrecision("total_protein_grams").default(0).notNull(),
    totalCarbsGrams: doublePrecision("total_carbs_grams").default(0).notNull(),
    totalFatGrams: doublePrecision("total_fat_grams").default(0).notNull(),
    totalFibreGrams: doublePrecision("total_fibre_grams").default(0).notNull(),
    totalCostPkr: doublePrecision("total_cost_pkr").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    planIdIdx: index("meal_plans_plan_id_idx").on(table.nutritionPlanId),
  })
);

export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;

// 4. Meals (Individual meal slots)
export const meals = pgTable(
  "meals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mealPlanId: uuid("meal_plan_id")
      .notNull()
      .references(() => mealPlans.id, { onDelete: "cascade" }),
    mealType: text("meal_type").notNull(), // breakfast, morning_snack, lunch, evening_snack, dinner
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    prepTimeMinutes: integer("prep_time_minutes").default(15).notNull(),
    instructions: text("instructions"), // recipe & cooking guide
    targetCalories: doublePrecision("target_calories"),
    totalCalories: doublePrecision("total_calories").default(0).notNull(),
    totalProteinGrams: doublePrecision("total_protein_grams").default(0).notNull(),
    totalCarbsGrams: doublePrecision("total_carbs_grams").default(0).notNull(),
    totalFatGrams: doublePrecision("total_fat_grams").default(0).notNull(),
    totalFibreGrams: doublePrecision("total_fibre_grams").default(0).notNull(),
    totalCostPkr: doublePrecision("total_cost_pkr").default(0).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    mealPlanIdIdx: index("meals_meal_plan_id_idx").on(table.mealPlanId),
    mealTypeIdx: index("meals_meal_type_idx").on(table.mealType),
  })
);

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

// 5. Meal Food Items (Ingredients within a meal)
export const mealFoodItems = pgTable(
  "meal_food_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    foodItemId: uuid("food_item_id").references(() => foodItems.id, {
      onDelete: "set null",
    }),
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    quantity: doublePrecision("quantity").notNull(),
    unit: text("unit").notNull(), // g, ml, piece, cup, tbsp, etc.
    weightGrams: doublePrecision("weight_grams").notNull(),
    calories: doublePrecision("calories").notNull(),
    proteinGrams: doublePrecision("protein_grams").notNull(),
    carbsGrams: doublePrecision("carbs_grams").notNull(),
    fatGrams: doublePrecision("fat_grams").notNull(),
    fibreGrams: doublePrecision("fibre_grams").default(0).notNull(),
    costPkr: doublePrecision("cost_pkr").default(0).notNull(),
    priceSource: text("price_source"),
    isVerifiedPrice: boolean("is_verified_price").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    mealIdIdx: index("meal_food_items_meal_id_idx").on(table.mealId),
    foodItemIdIdx: index("meal_food_items_food_item_id_idx").on(table.foodItemId),
  })
);

export type MealFoodItem = typeof mealFoodItems.$inferSelect;
export type NewMealFoodItem = typeof mealFoodItems.$inferInsert;

// 6. Food Substitutions History
export const foodSubstitutions = pgTable(
  "food_substitutions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    originalFoodItemId: uuid("original_food_item_id").references(() => foodItems.id, {
      onDelete: "set null",
    }),
    substituteFoodItemId: uuid("substitute_food_item_id").references(() => foodItems.id, {
      onDelete: "set null",
    }),
    originalNameEn: text("original_name_en").notNull(),
    substituteNameEn: text("substitute_name_en").notNull(),
    reason: text("reason"),
    calorieDelta: doublePrecision("calorie_delta").default(0).notNull(),
    proteinDelta: doublePrecision("protein_delta").default(0).notNull(),
    costDeltaPkr: doublePrecision("cost_delta_pkr").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    mealIdIdx: index("food_substitutions_meal_id_idx").on(table.mealId),
  })
);

export type FoodSubstitution = typeof foodSubstitutions.$inferSelect;
export type NewFoodSubstitution = typeof foodSubstitutions.$inferInsert;

// 7. Grocery Lists
export const groceryLists = pgTable(
  "grocery_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nutritionPlanId: uuid("nutrition_plan_id")
      .notNull()
      .references(() => nutritionPlans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    daysCovered: integer("days_covered").default(7).notNull(),
    totalEstimatedCostPkr: doublePrecision("total_estimated_cost_pkr").default(0).notNull(),
    status: text("status").default("active").notNull(), // active, completed, archived
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    planIdIdx: index("grocery_lists_plan_id_idx").on(table.nutritionPlanId),
    userIdIdx: index("grocery_lists_user_id_idx").on(table.userId),
  })
);

export type GroceryList = typeof groceryLists.$inferSelect;
export type NewGroceryList = typeof groceryLists.$inferInsert;

// 8. Grocery List Items
export const groceryListItems = pgTable(
  "grocery_list_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groceryListId: uuid("grocery_list_id")
      .notNull()
      .references(() => groceryLists.id, { onDelete: "cascade" }),
    foodItemId: uuid("food_item_id").references(() => foodItems.id, {
      onDelete: "set null",
    }),
    itemNameEn: text("item_name_en").notNull(),
    itemNameUr: text("item_name_ur").notNull(),
    category: text("category").default("other").notNull(),
    totalQuantity: doublePrecision("total_quantity").notNull(),
    unit: text("unit").notNull(),
    estimatedCostPkr: doublePrecision("estimated_cost_pkr").default(0).notNull(),
    isPurchased: boolean("is_purchased").default(false).notNull(),
    priceSource: text("price_source"),
    isVerifiedPrice: boolean("is_verified_price").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    groceryListIdIdx: index("grocery_list_items_list_id_idx").on(table.groceryListId),
  })
);

export type GroceryListItem = typeof groceryListItems.$inferSelect;
export type NewGroceryListItem = typeof groceryListItems.$inferInsert;

