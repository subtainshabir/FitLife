import { z } from "zod";

export const coachChatSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
  language: z.enum(["en", "ur"]).default("en"),
});

export const updateConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title cannot exceed 100 characters"),
});

export const applyRecommendationSchema = z.object({
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "Explicit confirmation is required to apply recommendations." }),
  }),
});

export type CoachChatInput = z.infer<typeof coachChatSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ApplyRecommendationInput = z.infer<typeof applyRecommendationSchema>;
