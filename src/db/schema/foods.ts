import {
  pgTable,
  text,
  timestamp,
  uuid,
  doublePrecision,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const foodCategories = pgTable(
  "food_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(), // protein, carbohydrates, fruits, vegetables, healthy_fats
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    descriptionEn: text("description_en"),
    descriptionUr: text("description_ur"),
    icon: text("icon").default("Apple").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("food_categories_slug_idx").on(table.slug),
  })
);

export type FoodCategory = typeof foodCategories.$inferSelect;
export type NewFoodCategory = typeof foodCategories.$inferInsert;

export const foodItems = pgTable(
  "food_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => foodCategories.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    descriptionEn: text("description_en"),
    descriptionUr: text("description_ur"),
    foodType: text("food_type").default("raw").notNull(), // raw, cooked, prepared, beverage, pantry
    defaultServingSize: doublePrecision("default_serving_size").default(100).notNull(),
    defaultServingUnit: text("default_serving_unit").default("g").notNull(), // g, piece, cup, tbsp, ml, etc.
    servingWeightGrams: doublePrecision("serving_weight_grams").default(100).notNull(), // weight in grams for 1 serving unit
    caloriesPer100g: doublePrecision("calories_per_100g").notNull(),
    proteinPer100g: doublePrecision("protein_per_100g").notNull(),
    carbsPer100g: doublePrecision("carbs_per_100g").notNull(),
    fatPer100g: doublePrecision("fat_per_100g").notNull(),
    fibrePer100g: doublePrecision("fibre_per_100g").default(0).notNull(),
    nutritionSource: text("nutrition_source").notNull(), // Food Composition Table for Pakistan / USDA FoodData Central
    image: text("image"),
    isCommonPakistaniFood: boolean("is_common_pakistani_food").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdIdx: index("food_items_category_id_idx").on(table.categoryId),
    nameEnIdx: index("food_items_name_en_idx").on(table.nameEn),
    nameUrIdx: index("food_items_name_ur_idx").on(table.nameUr),
    foodTypeIdx: index("food_items_food_type_idx").on(table.foodType),
  })
);

export type FoodItem = typeof foodItems.$inferSelect;
export type NewFoodItem = typeof foodItems.$inferInsert;

export const foodTranslations = pgTable(
  "food_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foodItems.id, { onDelete: "cascade" }),
    language: text("language").notNull(), // en, ur
    name: text("name").notNull(),
    description: text("description"),
    servingUnitName: text("serving_unit_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    foodLangIdx: uniqueIndex("food_translations_food_lang_idx").on(
      table.foodId,
      table.language
    ),
  })
);

export type FoodTranslation = typeof foodTranslations.$inferSelect;
export type NewFoodTranslation = typeof foodTranslations.$inferInsert;

