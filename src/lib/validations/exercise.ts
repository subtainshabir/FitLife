import { z } from "zod";

export const exerciseFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  muscle: z.string().max(50).optional(),
  equipment: z.string().max(50).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced", "all"]).optional(),
  trainingType: z.string().max(50).optional(),
  isBodyweight: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  sortBy: z.enum(["name", "difficulty", "calories", "recent"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ExerciseFilterInput = z.infer<typeof exerciseFilterSchema>;

export const exerciseSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ExerciseSearchInput = z.infer<typeof exerciseSearchSchema>;

