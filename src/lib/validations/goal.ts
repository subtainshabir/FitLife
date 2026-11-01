import { z } from "zod";
import { FITNESS_GOALS } from "./profile";

export const GOAL_STATUSES = ["in_progress", "completed", "paused", "abandoned"] as const;

export const createGoalSchema = z.object({
  goalType: z.enum(FITNESS_GOALS, {
    errorMap: () => ({ message: "Please select a valid fitness goal type" }),
  }),
  currentWeight: z
    .coerce
    .number({ invalid_type_error: "Current weight must be a valid number" })
    .min(20, "Weight must be at least 20 kg (44 lbs)")
    .max(500, "Weight must be 500 kg (1100 lbs) or under"),
  targetWeight: z
    .coerce
    .number({ invalid_type_error: "Target weight must be a valid number" })
    .min(20, "Target weight must be at least 20 kg (44 lbs)")
    .max(500, "Target weight must be 500 kg or under")
    .optional(),
  targetRate: z
    .coerce
    .number({ invalid_type_error: "Target rate must be a valid number" })
    .min(0.1, "Target rate must be at least 0.1 kg/week")
    .max(2.0, "Target rate must not exceed 2.0 kg/week")
    .optional(),
  startDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Start date must be a valid date"
    ),
  unit: z.enum(["metric", "imperial"]).default("metric"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateGoalSchema = z.object({
  status: z.enum(GOAL_STATUSES).optional(),
  targetWeight: z
    .coerce
    .number()
    .min(20)
    .max(500)
    .optional(),
  currentWeight: z
    .coerce
    .number()
    .min(20)
    .max(500)
    .optional(),
  targetRate: z
    .coerce
    .number()
    .min(0.1)
    .max(2.0)
    .optional(),
  notes: z.string().max(500).optional(),
  unit: z.enum(["metric", "imperial"]).default("metric"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

