import { pgTable, text, timestamp, uuid, doublePrecision, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    weightKg: doublePrecision("weight_kg"), // weight in kg
    heightCm: doublePrecision("height_cm"), // height in cm
    bodyFatPercentage: doublePrecision("body_fat_percentage"), // 0 - 100%
    waistCm: doublePrecision("waist_cm"), // circumferences in cm
    chestCm: doublePrecision("chest_cm"),
    hipCm: doublePrecision("hip_cm"),
    neckCm: doublePrecision("neck_cm"),
    armCm: doublePrecision("arm_cm"),
    forearmCm: doublePrecision("forearm_cm"),
    thighCm: doublePrecision("thigh_cm"),
    calfCm: doublePrecision("calf_cm"),
    unitSystem: text("unit_system").default("metric").notNull(), // 'metric' (cm, kg) or 'imperial' (in, lbs)
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("body_measurements_user_id_idx").on(table.userId),
    recordedAtIdx: index("body_measurements_recorded_at_idx").on(table.recordedAt),
  })
);

export const transformationPhotos = pgTable(
  "transformation_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    photoDate: timestamp("photo_date", { withTimezone: true }).defaultNow().notNull(),
    viewAngle: text("view_angle").notNull(), // 'front', 'side', 'back', 'other'
    weightKg: doublePrecision("weight_kg"), // optional weight at time of photo
    storagePath: text("storage_path").notNull(), // private storage path
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(), // 'image/jpeg', 'image/png', 'image/webp'
    isHidden: boolean("is_hidden").default(false).notNull(), // privacy toggle for dashboard
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("transformation_photos_user_id_idx").on(table.userId),
    photoDateIdx: index("transformation_photos_photo_date_idx").on(table.photoDate),
  })
);

export const progressMilestones = pgTable(
  "progress_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // 'weight', 'measurement', 'workout', 'nutrition', 'custom'
    milestoneKey: text("milestone_key"), // e.g. 'first_2kg_gain', 'first_5kg_loss', 'target_weight_reached'
    titleEn: text("title_en").notNull(),
    titleUr: text("title_ur").notNull(),
    descriptionEn: text("description_en"),
    descriptionUr: text("description_ur"),
    targetValue: doublePrecision("target_value"),
    currentValue: doublePrecision("current_value"),
    unit: text("unit"),
    isAchieved: boolean("is_achieved").default(false).notNull(),
    achievedAt: timestamp("achieved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("progress_milestones_user_id_idx").on(table.userId),
    categoryIdx: index("progress_milestones_category_idx").on(table.category),
    isAchievedIdx: index("progress_milestones_is_achieved_idx").on(table.isAchieved),
  })
);

export const progressReports = pgTable(
  "progress_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodType: text("period_type").notNull(), // '7_days', '30_days', '90_days', 'custom'
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    metrics: jsonb("metrics").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("progress_reports_user_id_idx").on(table.userId),
    createdAtIdx: index("progress_reports_created_at_idx").on(table.createdAt),
  })
);

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type NewBodyMeasurement = typeof bodyMeasurements.$inferInsert;

export type TransformationPhoto = typeof transformationPhotos.$inferSelect;
export type NewTransformationPhoto = typeof transformationPhotos.$inferInsert;

export type ProgressMilestone = typeof progressMilestones.$inferSelect;
export type NewProgressMilestone = typeof progressMilestones.$inferInsert;

export type ProgressReport = typeof progressReports.$inferSelect;
export type NewProgressReport = typeof progressReports.$inferInsert;
