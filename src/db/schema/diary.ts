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
import { foodItems } from "./foods";
import { mealFoodItems } from "./plans";

// 1. Daily Food Log (Container per user & date)
export const dailyFoodLogs = pgTable(
  "daily_food_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: text("log_date").notNull(), // Format: YYYY-MM-DD
    targetCalories: doublePrecision("target_calories").default(2000).notNull(),
    targetProteinGrams: doublePrecision("target_protein_grams").default(120).notNull(),
    targetCarbsGrams: doublePrecision("target_carbs_grams").default(250).notNull(),
    targetFatGrams: doublePrecision("target_fat_grams").default(65).notNull(),
    targetFibreGrams: doublePrecision("target_fibre_grams").default(30).notNull(),
    totalCalories: doublePrecision("total_calories").default(0).notNull(),
    totalProteinGrams: doublePrecision("total_protein_grams").default(0).notNull(),
    totalCarbsGrams: doublePrecision("total_carbs_grams").default(0).notNull(),
    totalFatGrams: doublePrecision("total_fat_grams").default(0).notNull(),
    totalFibreGrams: doublePrecision("total_fibre_grams").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: uniqueIndex("daily_food_logs_user_date_idx").on(table.userId, table.logDate),
    userIdIdx: index("daily_food_logs_user_id_idx").on(table.userId),
    logDateIdx: index("daily_food_logs_log_date_idx").on(table.logDate),
  })
);

export type DailyFoodLog = typeof dailyFoodLogs.$inferSelect;
export type NewDailyFoodLog = typeof dailyFoodLogs.$inferInsert;

// 2. Food Log Entry (Individual logged food item)
export const foodLogEntries = pgTable(
  "food_log_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyLogId: uuid("daily_log_id")
      .notNull()
      .references(() => dailyFoodLogs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    foodItemId: uuid("food_item_id").references(() => foodItems.id, {
      onDelete: "set null",
    }),
    mealCategory: text("meal_category").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
    foodNameEn: text("food_name_en").notNull(),
    foodNameUr: text("food_name_ur"),
    quantity: doublePrecision("quantity").notNull(),
    unit: text("unit").notNull(), // 'g', 'piece', 'cup', 'tbsp', 'ml', 'roti', etc.
    weightGrams: doublePrecision("weight_grams").notNull(),
    // Nutritional snapshots at time of consumption
    calories: doublePrecision("calories").notNull(),
    proteinGrams: doublePrecision("protein_grams").notNull(),
    carbsGrams: doublePrecision("carbs_grams").notNull(),
    fatGrams: doublePrecision("fat_grams").notNull(),
    fibreGrams: doublePrecision("fibre_grams").default(0).notNull(),
    // Meal plan integration & idempotency tracking
    plannedMealFoodItemId: uuid("planned_meal_food_item_id").references(() => mealFoodItems.id, {
      onDelete: "set null",
    }),
    isFromMealPlan: boolean("is_from_meal_plan").default(false).notNull(),
    idempotencyKey: text("idempotency_key"), // e.g. import_<mealFoodItemId>_<date>
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dailyLogIdIdx: index("food_log_entries_daily_log_id_idx").on(table.dailyLogId),
    userIdIdx: index("food_log_entries_user_id_idx").on(table.userId),
    mealCategoryIdx: index("food_log_entries_meal_category_idx").on(table.mealCategory),
    idempotencyKeyIdx: index("food_log_entries_idempotency_key_idx").on(table.idempotencyKey),
  })
);

export type FoodLogEntry = typeof foodLogEntries.$inferSelect;
export type NewFoodLogEntry = typeof foodLogEntries.$inferInsert;

// 3. Water Intake Entries
export const waterIntakeEntries = pgTable(
  "water_intake_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: text("log_date").notNull(), // Format: YYYY-MM-DD
    amountMl: integer("amount_ml").notNull(), // e.g. 150, 250, 500, 1000
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index("water_intake_user_date_idx").on(table.userId, table.logDate),
  })
);

export type WaterIntakeEntry = typeof waterIntakeEntries.$inferSelect;
export type NewWaterIntakeEntry = typeof waterIntakeEntries.$inferInsert;

// 4. User Water Goals
export const userWaterGoals = pgTable(
  "user_water_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyTargetMl: integer("daily_target_ml").default(2500).notNull(),
    containerSizeMl: integer("container_size_ml").default(250).notNull(), // preferred quick logging unit
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_water_goals_user_id_idx").on(table.userId),
  })
);

export type UserWaterGoal = typeof userWaterGoals.$inferSelect;
export type NewUserWaterGoal = typeof userWaterGoals.$inferInsert;

// 5. Favourite Foods
export const favouriteFoods = pgTable(
  "favourite_foods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    foodItemId: uuid("food_item_id")
      .notNull()
      .references(() => foodItems.id, { onDelete: "cascade" }),
    customServingSize: doublePrecision("custom_serving_size"),
    customServingUnit: text("custom_serving_unit"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userFoodIdx: uniqueIndex("favourite_foods_user_food_idx").on(table.userId, table.foodItemId),
    userIdIdx: index("favourite_foods_user_id_idx").on(table.userId),
  })
);

export type FavouriteFood = typeof favouriteFoods.$inferSelect;
export type NewFavouriteFood = typeof favouriteFoods.$inferInsert;

// 6. Saved Meals (Quick Multi-Item Templates)
export const savedMeals = pgTable(
  "saved_meals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameUr: text("name_ur"),
    mealCategory: text("meal_category").default("lunch").notNull(),
    items: jsonb("items")
      .$type<
        Array<{
          foodItemId?: string | null;
          nameEn: string;
          nameUr?: string;
          quantity: number;
          unit: string;
          weightGrams: number;
          calories: number;
          proteinGrams: number;
          carbsGrams: number;
          fatGrams: number;
          fibreGrams: number;
        }>
      >()
      .default([])
      .notNull(),
    totalCalories: doublePrecision("total_calories").default(0).notNull(),
    totalProteinGrams: doublePrecision("total_protein_grams").default(0).notNull(),
    totalCarbsGrams: doublePrecision("total_carbs_grams").default(0).notNull(),
    totalFatGrams: doublePrecision("total_fat_grams").default(0).notNull(),
    totalFibreGrams: doublePrecision("total_fibre_grams").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("saved_meals_user_id_idx").on(table.userId),
  })
);

export type SavedMeal = typeof savedMeals.$inferSelect;
export type NewSavedMeal = typeof savedMeals.$inferInsert;

// Relations
export const dailyFoodLogsRelations = relations(dailyFoodLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyFoodLogs.userId],
    references: [users.id],
  }),
  entries: many(foodLogEntries),
}));

export const foodLogEntriesRelations = relations(foodLogEntries, ({ one }) => ({
  dailyLog: one(dailyFoodLogs, {
    fields: [foodLogEntries.dailyLogId],
    references: [dailyFoodLogs.id],
  }),
  user: one(users, {
    fields: [foodLogEntries.userId],
    references: [users.id],
  }),
  foodItem: one(foodItems, {
    fields: [foodLogEntries.foodItemId],
    references: [foodItems.id],
  }),
  plannedMealFoodItem: one(mealFoodItems, {
    fields: [foodLogEntries.plannedMealFoodItemId],
    references: [mealFoodItems.id],
  }),
}));

export const waterIntakeEntriesRelations = relations(waterIntakeEntries, ({ one }) => ({
  user: one(users, {
    fields: [waterIntakeEntries.userId],
    references: [users.id],
  }),
}));

export const userWaterGoalsRelations = relations(userWaterGoals, ({ one }) => ({
  user: one(users, {
    fields: [userWaterGoals.userId],
    references: [users.id],
  }),
}));

export const favouriteFoodsRelations = relations(favouriteFoods, ({ one }) => ({
  user: one(users, {
    fields: [favouriteFoods.userId],
    references: [users.id],
  }),
  foodItem: one(foodItems, {
    fields: [favouriteFoods.foodItemId],
    references: [foodItems.id],
  }),
}));

export const savedMealsRelations = relations(savedMeals, ({ one }) => ({
  user: one(users, {
    fields: [savedMeals.userId],
    references: [users.id],
  }),
}));
