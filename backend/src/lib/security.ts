import { createHash, createHmac, randomBytes } from "node:crypto";

import { env } from "../config/env.js";

export function createRandomToken(bytes = 48): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createOtpCode(): string {
  return String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function hashOtp(email: string, purpose: string, otp: string): string {
  return createHmac("sha256", env.COOKIE_SECRET)
    .update(`${email.toLowerCase()}:${purpose}:${otp}`)
    .digest("hex");
}

export function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return leftBuffer.equals(rightBuffer);
}
