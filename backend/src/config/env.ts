import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { z } from "zod";

const configDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(configDir, "../../../.env") });
config({ path: resolve(configDir, "../../.env"), override: false });

const envSchema = z.object({
  ADMIN_ORIGIN: z.string().url().default("http://localhost:3001"),
  CORS_ORIGINS: z.string().optional(),
  COOKIE_SECRET: z.string().min(24).default("development-cookie-secret-change-me"),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://matcha_app:matcha_dev_password@localhost:5432/matcha"),
  EMAIL_FROM: z.string().default("MatchA <hello@matcha.local>"),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(24).default("development-access-secret-change-me"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(24).default("development-refresh-secret-change-me"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  SMTP_HOST: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

export const allowedCorsOrigins = [
  env.WEB_ORIGIN,
  env.ADMIN_ORIGIN,
  ...(env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
];
