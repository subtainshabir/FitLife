import { z } from "zod";

export const weightLogSchema = z.object({
  weight: z
    .coerce
    .number({ invalid_type_error: "Weight must be a valid number" })
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight must be 500 kg or under"),
  height: z
    .coerce
    .number()
    .min(50)
    .max(300)
    .optional(),
  unit: z.enum(["kg", "lbs"]).default("kg"),
  notes: z.string().max(250).optional(),
  recordedAt: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "Recorded date must be a valid date"
    ),
  updateProfileCurrentWeight: z.boolean().default(true),
});

export type WeightLogInput = z.infer<typeof weightLogSchema>;

