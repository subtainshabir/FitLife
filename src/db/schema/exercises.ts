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

// 1. Exercise Categories
export const exerciseCategories = pgTable(
  "exercise_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(), // strength, bodyweight, cardio, flexibility, mobility, core, rehabilitation
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    descriptionEn: text("description_en"),
    descriptionUr: text("description_ur"),
    icon: text("icon").default("Dumbbell").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("exercise_categories_slug_idx").on(table.slug),
  })
);

export type ExerciseCategory = typeof exerciseCategories.$inferSelect;
export type NewExerciseCategory = typeof exerciseCategories.$inferInsert;

// 2. Muscle Groups Catalog & Anatomy Details
export const muscleGroups = pgTable(
  "muscle_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(), // chest, back, shoulders, biceps, triceps, forearms, quadriceps, hamstrings, glutes, calves, abdominals, full_body
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    bodyRegion: text("body_region").notNull(), // upper_body, lower_body, core, full_body
    view: text("view").notNull(), // front, back, both
    descriptionEn: text("description_en"),
    descriptionUr: text("description_ur"),
    functionEn: text("function_en"),
    functionUr: text("function_ur"),
    svgId: text("svg_id").notNull(), // matches interactive SVG muscle layer ID (e.g. "muscle-chest", "muscle-quads")
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("muscle_groups_slug_idx").on(table.slug),
    bodyRegionIdx: index("muscle_groups_body_region_idx").on(table.bodyRegion),
  })
);

export type MuscleGroup = typeof muscleGroups.$inferSelect;
export type NewMuscleGroup = typeof muscleGroups.$inferInsert;

// 3. Exercises Library
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => exerciseCategories.id, { onDelete: "cascade" }),
    nameEn: text("name_en").notNull(),
    nameUr: text("name_ur").notNull(),
    slug: text("slug").notNull().unique(), // e.g. push-ups, barbell-bench-press
    descriptionEn: text("description_en").notNull(),
    descriptionUr: text("description_ur").notNull(),
    primaryMuscleId: uuid("primary_muscle_id")
      .notNull()
      .references(() => muscleGroups.id, { onDelete: "cascade" }),
    primaryMuscle: text("primary_muscle").notNull(), // slug e.g. chest, back, shoulders
    secondaryMuscles: jsonb("secondary_muscles").$type<string[]>().default([]).notNull(), // array of muscle slugs e.g. ["triceps", "shoulders"]
    trainingType: text("training_type").notNull(), // strength, bodyweight, cardio, flexibility, mobility, core, rehabilitation
    exerciseType: text("exercise_type").default("compound").notNull(), // compound, isolation, cardio, isometric, dynamic
    difficulty: text("difficulty").default("beginner").notNull(), // beginner, intermediate, advanced
    equipment: text("equipment").default("none").notNull(), // none, dumbbells, barbell, cable, machine, resistance_band, pull_up_bar, bench, cardio_machine
    movementPattern: text("movement_pattern").default("push").notNull(), // push, pull, squat, hinge, lunge, carry, rotation, isolation, cardio
    isBodyweight: boolean("is_bodyweight").default(false).notNull(),
    startingPositionEn: text("starting_position_en").notNull(),
    startingPositionUr: text("starting_position_ur").notNull(),
    executionStepsEn: jsonb("execution_steps_en").$type<string[]>().default([]).notNull(),
    executionStepsUr: jsonb("execution_steps_ur").$type<string[]>().default([]).notNull(),
    breathingPatternEn: text("breathing_pattern_en").notNull(),
    breathingPatternUr: text("breathing_pattern_ur").notNull(),
    safetyPrecautionsEn: jsonb("safety_precautions_en").$type<string[]>().default([]).notNull(),
    safetyPrecautionsUr: jsonb("safety_precautions_ur").$type<string[]>().default([]).notNull(),
    commonMistakesEn: jsonb("common_mistakes_en").$type<string[]>().default([]).notNull(),
    commonMistakesUr: jsonb("common_mistakes_ur").$type<string[]>().default([]).notNull(),
    easierVariation: text("easier_variation"),
    harderVariation: text("harder_variation"),
    alternativeExerciseIds: jsonb("alternative_exercise_ids").$type<string[]>().default([]).notNull(),
    estimatedMetValue: doublePrecision("estimated_met_value"), // Metabolic Equivalent of Task from Compendium of Physical Activities
    estimatedCaloriesPerMinute: doublePrecision("estimated_calories_per_minute"), // standard estimate for 70kg individual
    demoMediaUrl: text("demo_media_url"), // URL or path to demonstration illustration / video / animation
    thumbnailUrl: text("thumbnail_url"),
    mediaType: text("media_type").default("illustration").notNull(), // illustration, animation, video, photo
    mediaAttribution: text("media_attribution").default("FitLife AI Anatomical Motion Guide"),
    isVerified: boolean("is_verified").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("exercises_slug_idx").on(table.slug),
    categoryIdx: index("exercises_category_idx").on(table.categoryId),
    primaryMuscleIdx: index("exercises_primary_muscle_idx").on(table.primaryMuscle),
    trainingTypeIdx: index("exercises_training_type_idx").on(table.trainingType),
    difficultyIdx: index("exercises_difficulty_idx").on(table.difficulty),
    equipmentIdx: index("exercises_equipment_idx").on(table.equipment),
  })
);

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

