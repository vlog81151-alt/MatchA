import type { NextFunction, Request, Response } from "express";

import { ACCESS_TOKEN_COOKIE } from "./cookie.service.js";
import { verifyAccessToken } from "./token.service.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import { toPublicAuthUser } from "./auth.types.js";

function readSignedCookie(request: Request, name: string): string | undefined {
  const signedCookies = request.signedCookies as Record<string, unknown> | undefined;
  const value = signedCookies?.[name];

  return typeof value === "string" ? value : undefined;
}

function readBearerToken(request: Request): string | undefined {
  const header = request.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length);
}

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  void (async () => {
    const token = readBearerToken(request) ?? readSignedCookie(request, ACCESS_TOKEN_COOKIE);

    if (!token) {
      throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    });

    if (!user || user.deletedAt || user.isBanned) {
      throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }

    request.user = toPublicAuthUser(user);
    next();
  })().catch(next);
}
