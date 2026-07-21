import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be shorter than 128 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const signupSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2).max(80),
  password: passwordSchema,
  rememberMe: z.boolean().default(true)
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().default(false)
});

export const requestOtpSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["EMAIL_LOGIN", "EMAIL_VERIFICATION"]).default("EMAIL_LOGIN")
});

export const verifyOtpSchema = requestOtpSchema.extend({
  otp: z.string().length(6)
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  token: z.string().min(24)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).optional()
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(20),
  rememberMe: z.boolean().default(true)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
