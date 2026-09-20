import "server-only";
import { z } from "zod";

export const PASSWORD_POLICY = {
  min: 8,
  max: 72,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  requireSpecial: true,
};

export const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.min, `At least ${PASSWORD_POLICY.min} characters`)
  .max(PASSWORD_POLICY.max)
  .regex(/[A-Z]/, "Needs an uppercase letter")
  .regex(/[a-z]/, "Needs a lowercase letter")
  .regex(/[0-9]/, "Needs a number")
  .regex(/[^A-Za-z0-9]/, "Needs a special character");

export const emailSchema = z.string().trim().toLowerCase().email("Invalid email");

export const namesSchema = z
  .string()
  .trim()
  .min(2, "Name is too short")
  .max(80)
  .regex(/^[\p{L}\p{N}' .-]+$/u, "Name contains invalid characters");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

export const yearLevelSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .nullable();

export const sendOtpSchema = z.object({
  email: emailSchema,
  mode: z.enum(["login", "signup"]),
  full_name: namesSchema.optional(),
  role: z.enum(["mentor", "mentee"]).optional(),
  year_level: yearLevelSchema.optional(),
  mentor_code: z.string().max(64).optional(),
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  token: otpSchema,
  mode: z.enum(["login", "signup"]),
  password: passwordSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(72),
});

export const attendanceSchema = z.object({
  week_no: z.number().int().min(1).max(52),
  status: z.enum(["present", "late", "absent"]).optional(),
  note: z.string().trim().max(200).optional().nullable(),
});

export const feedbackSchema = z.object({
  subject: z.string().trim().min(3, "Subject is too short").max(120),
  message: z.string().trim().min(5, "Message is too short").max(2000),
  category: z.enum(["general", "bug", "content", "suggestion"]).optional(),
});

export const quizSubmitSchema = z.object({
  quiz_id: z.string().uuid(),
  answers: z.array(
    z.object({
      question_index: z.number().int().min(0),
      selected: z.number().int().min(-1),
    })
  ),
  started_at: z.string().datetime(),
  violations: z.number().int().min(0).max(50).optional(),
});

export const moduleSchema = z.object({
  week_no: z.number().int().min(1).max(52),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(400).optional().nullable(),
  content: z.string().trim().min(20).max(60_000),
  video_url: z.string().url().optional().nullable().or(z.literal("")),
  published: z.boolean().optional(),
});

export const quizCreateSchema = z.object({
  week_no: z.number().int().min(1).max(52),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(400).optional().nullable(),
  time_limit_sec: z.number().int().min(30).max(3600).optional(),
  published: z.boolean().optional(),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(3).max(1000),
        options: z.array(z.string().trim().min(1).max(500)).length(4),
        correct_index: z.number().int().min(0).max(3),
        points: z.number().int().min(1).max(10).optional(),
      })
    )
    .min(1)
    .max(100),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type QuizCreateInput = z.infer<typeof quizCreateSchema>;