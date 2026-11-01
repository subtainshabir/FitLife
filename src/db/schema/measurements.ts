import { pgTable, text, timestamp, uuid, doublePrecision, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const bodyMeasurementHistory = pgTable(
  "body_measurement_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weight: doublePrecision("weight").notNull(), // stored in kg
    height: doublePrecision("height"), // stored in cm if provided
    unit: text("unit").default("kg").notNull(), // 'kg' or 'lbs' for recorded reference
    source: text("source").default("manual").notNull(), // 'assessment', 'manual', 'goal'
    notes: text("notes"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("body_measurement_history_user_id_idx").on(table.userId),
    recordedAtIdx: index("body_measurement_history_recorded_at_idx").on(table.recordedAt),
  })
);

export type BodyMeasurementHistory = typeof bodyMeasurementHistory.$inferSelect;
export type NewBodyMeasurementHistory = typeof bodyMeasurementHistory.$inferInsert;

