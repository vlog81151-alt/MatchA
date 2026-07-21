import nodemailer from "nodemailer";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      auth: {
        pass: env.SMTP_PASS,
        user: env.SMTP_USER
      },
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465
    })
  : null;

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!transporter) {
    logger.info({ email, otp }, "SMTP not configured; OTP generated for local development");
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    html: `<p>Your MatchA OTP is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    subject: "Your MatchA verification code",
    text: `Your MatchA OTP is ${otp}. This code expires in 10 minutes.`,
    to: email
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!transporter) {
    logger.info({ email, resetUrl }, "SMTP not configured; password reset URL generated locally");
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    html: `<p>Reset your MatchA password using this secure link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
    subject: "Reset your MatchA password",
    text: `Reset your MatchA password: ${resetUrl}. This link expires in 30 minutes.`,
    to: email
  });
}
