import type { Response } from "express";

import { isProduction } from "../config/env.js";
import { durationToMilliseconds } from "../lib/duration.js";
import type { AuthTokens } from "./auth.types.js";

export const ACCESS_TOKEN_COOKIE = "matcha_access";
export const REFRESH_TOKEN_COOKIE = "matcha_refresh";

export function setAuthCookies(response: Response, tokens: AuthTokens): void {
  response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    maxAge: Math.max(0, new Date(tokens.accessTokenExpiresAt).getTime() - Date.now()),
    sameSite: "lax",
    secure: isProduction,
    signed: true
  });

  response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    maxAge: Math.max(0, new Date(tokens.refreshTokenExpiresAt).getTime() - Date.now()),
    sameSite: "lax",
    secure: isProduction,
    signed: true
  });
}

export function clearAuthCookies(response: Response): void {
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    signed: true
  };

  response.clearCookie(ACCESS_TOKEN_COOKIE, baseOptions);
  response.clearCookie(REFRESH_TOKEN_COOKIE, baseOptions);
}

export function accessCookieMaxAge(ttl: string): number {
  return durationToMilliseconds(ttl);
}
