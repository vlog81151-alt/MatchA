import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import { addDuration } from "../lib/duration.js";
import { sha256 } from "../lib/security.js";
import { prisma } from "../lib/prisma.js";
import type { RequestContext } from "./auth.types.js";

interface AccessPayload {
  role: string;
  sessionId: string;
  sub: string;
  type: "access";
}

interface RefreshPayload {
  familyId: string;
  sessionId: string;
  sub: string;
  type: "refresh";
}

export function signAccessToken(payload: Omit<AccessPayload, "type">): {
  expiresAt: Date;
  token: string;
} {
  const expiresAt = addDuration(new Date(), env.JWT_ACCESS_TTL);
  const token = jwt.sign(
    {
      ...payload,
      type: "access"
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_TTL
    } as SignOptions
  );

  return { expiresAt, token };
}

function signRefreshToken(
  payload: Omit<RefreshPayload, "type">,
  tokenId: string,
  ttl: string
): string {
  return jwt.sign(
    {
      ...payload,
      type: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: ttl,
      jwtid: tokenId
    } as SignOptions
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (typeof payload === "string" || payload.type !== "access") {
    throw new Error("Invalid access token");
  }

  return payload as unknown as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload & { jti: string } {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);

  if (
    typeof payload === "string" ||
    payload.type !== "refresh" ||
    typeof payload.jti !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }

  return payload as unknown as RefreshPayload & { jti: string };
}

export async function createSessionTokens({
  context,
  rememberMe,
  user
}: {
  context: RequestContext;
  rememberMe: boolean;
  user: { id: string; role: string };
}) {
  const refreshTtl = rememberMe ? env.JWT_REFRESH_TTL : "1d";
  const refreshExpiresAt = addDuration(new Date(), refreshTtl);
  const session = await prisma.session.create({
    data: {
      expiresAt: refreshExpiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      userId: user.id
    }
  });
  const familyId = randomUUID();
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken(
    {
      familyId,
      sessionId: session.id,
      sub: user.id
    },
    tokenId,
    refreshTtl
  );
  const accessToken = signAccessToken({
    role: user.role,
    sessionId: session.id,
    sub: user.id
  });

  await prisma.refreshToken.create({
    data: {
      expiresAt: refreshExpiresAt,
      familyId,
      id: tokenId,
      sessionId: session.id,
      tokenHash: sha256(refreshToken),
      userId: user.id
    }
  });

  return {
    accessToken: accessToken.token,
    accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
    refreshToken,
    refreshTokenExpiresAt: refreshExpiresAt.toISOString()
  };
}

export async function rotateRefreshToken({
  context,
  refreshToken,
  userRole
}: {
  context: RequestContext;
  refreshToken: string;
  userRole: string;
}) {
  const payload = verifyRefreshToken(refreshToken);
  const now = new Date();
  const stored = await prisma.refreshToken.findUnique({
    include: {
      session: true,
      user: true
    },
    where: {
      id: payload.jti
    }
  });

  if (
    !stored ||
    stored.revokedAt ||
    stored.rotatedAt ||
    stored.expiresAt <= now ||
    stored.tokenHash !== sha256(refreshToken) ||
    stored.userId !== payload.sub ||
    stored.sessionId !== payload.sessionId ||
    !stored.session ||
    stored.session.revokedAt ||
    stored.session.expiresAt <= now
  ) {
    throw new Error("Invalid refresh token");
  }

  const nextTokenId = randomUUID();
  const nextRefreshToken = signRefreshToken(
    {
      familyId: stored.familyId,
      sessionId: stored.session.id,
      sub: stored.userId
    },
    nextTokenId,
    env.JWT_REFRESH_TTL
  );
  const nextRefreshExpiresAt = addDuration(now, env.JWT_REFRESH_TTL);
  const accessToken = signAccessToken({
    role: userRole,
    sessionId: stored.session.id,
    sub: stored.userId
  });

  await prisma.$transaction([
    prisma.session.update({
      data: {
        expiresAt: nextRefreshExpiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      },
      where: {
        id: stored.session.id
      }
    }),
    prisma.refreshToken.update({
      data: {
        rotatedAt: now,
        revokedAt: now
      },
      where: {
        id: stored.id
      }
    }),
    prisma.refreshToken.create({
      data: {
        expiresAt: nextRefreshExpiresAt,
        familyId: stored.familyId,
        id: nextTokenId,
        sessionId: stored.session.id,
        tokenHash: sha256(nextRefreshToken),
        userId: stored.userId
      }
    })
  ]);

  return {
    accessToken: accessToken.token,
    accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
    refreshToken: nextRefreshToken,
    refreshTokenExpiresAt: nextRefreshExpiresAt.toISOString(),
    user: stored.user
  };
}
