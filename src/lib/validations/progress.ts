import { z } from "zod";

export const bodyMeasurementSchema = z
  .object({
    recordedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    unitSystem: z.enum(["metric", "imperial"]).default("metric"),
    weight: z.number().positive().max(500, "Weight exceeds safe limits").optional(),
    height: z.number().positive().max(300, "Height exceeds safe limits").optional(),
    bodyFatPercentage: z.number().min(1).max(70, "Body fat must be between 1% and 70%").optional(),
    waist: z.number().positive().max(300).optional(),
    chest: z.number().positive().max(300).optional(),
    hip: z.number().positive().max(300).optional(),
    neck: z.number().positive().max(100).optional(),
    arm: z.number().positive().max(100).optional(),
    forearm: z.number().positive().max(100).optional(),
    thigh: z.number().positive().max(150).optional(),
    calf: z.number().positive().max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      return (
        data.weight !== undefined ||
        data.height !== undefined ||
        data.bodyFatPercentage !== undefined ||
        data.waist !== undefined ||
        data.chest !== undefined ||
        data.hip !== undefined ||
        data.neck !== undefined ||
        data.arm !== undefined ||
        data.forearm !== undefined ||
        data.thigh !== undefined ||
        data.calf !== undefined ||
        (data.notes !== undefined && data.notes.trim().length > 0)
      );
    },
    {
      message: "Please provide at least one measurement or note.",
    }
  );

export const updateBodyMeasurementSchema = z.object({
  recordedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  unitSystem: z.enum(["metric", "imperial"]).optional(),
  weight: z.number().positive().max(500).optional().nullable(),
  height: z.number().positive().max(300).optional().nullable(),
  bodyFatPercentage: z.number().min(1).max(70).optional().nullable(),
  waist: z.number().positive().max(300).optional().nullable(),
  chest: z.number().positive().max(300).optional().nullable(),
  hip: z.number().positive().max(300).optional().nullable(),
  neck: z.number().positive().max(100).optional().nullable(),
  arm: z.number().positive().max(100).optional().nullable(),
  forearm: z.number().positive().max(100).optional().nullable(),
  thigh: z.number().positive().max(150).optional().nullable(),
  calf: z.number().positive().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const customMilestoneSchema = z.object({
  category: z.enum(["weight", "measurement", "workout", "nutrition", "custom"]).default("custom"),
  titleEn: z.string().min(2, "Title must be at least 2 characters").max(100),
  titleUr: z.string().min(2, "Urdu title must be at least 2 characters").max(100),
  descriptionEn: z.string().max(300).optional(),
  descriptionUr: z.string().max(300).optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().max(20).optional(),
});

export const updateMilestoneSchema = z.object({
  currentValue: z.number().optional(),
  isAchieved: z.boolean().optional(),
  achievedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const saveReportSchema = z.object({
  periodType: z.enum(["7_days", "30_days", "90_days", "custom"]),
  startDate: z.string(),
  endDate: z.string(),
  metrics: z.record(z.any()),
});

export const photoUploadSchema = z.object({
  viewAngle: z.enum(["front", "side", "back", "other"]),
  photoDate: z.string().optional(),
  weightKg: z.number().positive().max(500).optional(),
  isHidden: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});
