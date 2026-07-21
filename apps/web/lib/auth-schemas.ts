import { z } from "zod";

export const emailSchema = z.string().email("Enter a valid email").trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use fewer than 128 characters")
  .regex(/[A-Z]/, "Add one uppercase letter")
  .regex(/[a-z]/, "Add one lowercase letter")
  .regex(/[0-9]/, "Add one number");

export const signupFormSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(2, "Enter your name").max(80),
  password: passwordSchema,
  rememberMe: z.boolean().default(true)
});

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean().default(false)
});

export const forgotPasswordFormSchema = z.object({
  email: emailSchema
});

export const resetPasswordFormSchema = z.object({
  password: passwordSchema,
  token: z.string().min(24, "Reset token is missing")
});

export const otpRequestFormSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["EMAIL_LOGIN", "EMAIL_VERIFICATION"]).default("EMAIL_LOGIN")
});

export const otpVerifyFormSchema = otpRequestFormSchema.extend({
  otp: z.string().length(6, "Enter the 6 digit OTP")
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type OtpRequestFormValues = z.infer<typeof otpRequestFormSchema>;
export type OtpVerifyFormValues = z.infer<typeof otpVerifyFormSchema>;
