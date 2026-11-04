import { pgTable, text, timestamp, uuid, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const coachConversations = pgTable(
  "coach_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").default("New Coaching Session").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("coach_conversations_user_id_idx").on(table.userId),
    updatedAtIdx: index("coach_conversations_updated_at_idx").on(table.updatedAt),
  })
);

export const coachMessages = pgTable(
  "coach_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => coachConversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user' | 'assistant' | 'system'
    content: text("content").notNull(),
    suggestedActions: jsonb("suggested_actions").$type<Array<{
      action: string;
      label: string;
      href?: string;
      payload?: Record<string, unknown>;
    }>>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("coach_messages_conversation_id_idx").on(table.conversationId),
    userIdIdx: index("coach_messages_user_id_idx").on(table.userId),
    createdAtIdx: index("coach_messages_created_at_idx").on(table.createdAt),
  })
);

export const coachRecommendations = pgTable(
  "coach_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => coachConversations.id, { onDelete: "set null" }),
    category: text("category").notNull(), // 'nutrition' | 'workout' | 'goal' | 'general'
    title: text("title").notNull(),
    description: text("description").notNull(),
    actionType: text("action_type").notNull(), // 'explore_food' | 'view_exercise' | 'open_routine' | 'view_progress' | 'adjust_goal'
    actionPayload: jsonb("action_payload").$type<Record<string, unknown>>().default({}).notNull(),
    isApplied: boolean("is_applied").default(false).notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("coach_recommendations_user_id_idx").on(table.userId),
    isAppliedIdx: index("coach_recommendations_is_applied_idx").on(table.isApplied),
  })
);

export type CoachConversation = typeof coachConversations.$inferSelect;
export type NewCoachConversation = typeof coachConversations.$inferInsert;

export type CoachMessage = typeof coachMessages.$inferSelect;
export type NewCoachMessage = typeof coachMessages.$inferInsert;

export type CoachRecommendation = typeof coachRecommendations.$inferSelect;
export type NewCoachRecommendation = typeof coachRecommendations.$inferInsert;

