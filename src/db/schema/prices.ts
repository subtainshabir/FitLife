import {
  pgTable,
  text,
  timestamp,
  uuid,
  doublePrecision,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { foodItems } from "./foods";
import { users } from "./users";

export const priceSources = pgTable(
  "price_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull(), // government, retailer, manual_review, user_submission
    referenceUrl: text("reference_url"),
    reliabilityScore: doublePrecision("reliability_score").default(0.95).notNull(), // 0.0 to 1.0
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceTypeIdx: index("price_sources_source_type_idx").on(table.sourceType),
  })
);

export type PriceSource = typeof priceSources.$inferSelect;
export type NewPriceSource = typeof priceSources.$inferInsert;

export const foodPrices = pgTable(
  "food_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foodItems.id, { onDelete: "cascade" }),
    country: text("country").default("Pakistan").notNull(),
    province: text("province").notNull(), // Punjab, Sindh, KPK, Balochistan, Azad Jammu & Kashmir, Islamabad Capital Territory
    city: text("city").notNull(), // Kotli, Rawalpindi, Islamabad, Lahore, Karachi, etc.
    marketRetailer: text("market_retailer").notNull(), // e.g. Kotli Central Bazaar, Raja Bazaar, G-9 Sunday Bazaar, Empress Market
    price: doublePrecision("price").notNull(), // in currency (e.g. PKR)
    quantity: doublePrecision("quantity").default(1).notNull(),
    unit: text("unit").notNull(), // kg, dozen, liter, g, piece
    pricePerStandardUnit: doublePrecision("price_per_standard_unit").notNull(), // normalized price per kg or dozen/liter
    standardUnit: text("standard_unit").default("kg").notNull(),
    currency: text("currency").default("PKR").notNull(),
    collectionDate: timestamp("collection_date", { withTimezone: true }).defaultNow().notNull(),
    sourceId: uuid("source_id").references(() => priceSources.id, { onDelete: "set null" }),
    verificationStatus: text("verification_status").default("verified").notNull(), // verified, unverified, expired, under_review
    confidenceLevel: text("confidence_level").default("high").notNull(), // high, medium, low
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    foodIdIdx: index("food_prices_food_id_idx").on(table.foodId),
    cityIdx: index("food_prices_city_idx").on(table.city),
    statusIdx: index("food_prices_verification_status_idx").on(table.verificationStatus),
    cityFoodIdx: index("food_prices_city_food_idx").on(table.city, table.foodId),
  })
);

export type FoodPrice = typeof foodPrices.$inferSelect;
export type NewFoodPrice = typeof foodPrices.$inferInsert;

