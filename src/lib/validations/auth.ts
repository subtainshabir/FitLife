import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(100, { message: "Name must not exceed 100 characters." }),
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address." })
    .toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(100, { message: "Password must not exceed 100 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please provide a valid email address." })
    .toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

