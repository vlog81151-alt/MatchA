import argon2 from "argon2";
import type { User } from "@prisma/client";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { addDuration } from "../lib/duration.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { createOtpCode, createRandomToken, hashOtp, sha256 } from "../lib/security.js";
import { sendOtpEmail, sendPasswordResetEmail } from "./email.service.js";
import { verifyGoogleIdToken } from "./google.service.js";
import { createSessionTokens, rotateRefreshToken, verifyRefreshToken } from "./token.service.js";
import type {
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginInput,
  RequestOtpInput,
  ResetPasswordInput,
  SignupInput,
  VerifyOtpInput
} from "./auth.schemas.js";
import type { AuthResult, RequestContext } from "./auth.types.js";
import { toPublicAuthUser } from "./auth.types.js";

const invalidCredentialsError = new HttpError(
  401,
  "INVALID_CREDENTIALS",
  "Invalid email or password"
);

async function createAuditLog({
  action,
  context,
  entity,
  entityId,
  userId
}: {
  action:
    | "USER_CREATED"
    | "LOGIN"
    | "LOGOUT"
    | "TOKEN_REFRESHED"
    | "EMAIL_OTP_REQUESTED"
    | "EMAIL_OTP_VERIFIED"
    | "PASSWORD_RESET_REQUESTED"
    | "PASSWORD_RESET_COMPLETED"
    | "EMAIL_VERIFIED";
  context: RequestContext;
  entity: string;
  entityId?: string;
  userId?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      actorId: userId,
      entity,
      entityId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }
  });
}

function ensureUserCanAuthenticate(user: User): void {
  if (user.deletedAt) {
    throw invalidCredentialsError;
  }

  if (user.isBanned) {
    throw new HttpError(403, "ACCOUNT_BANNED", "This account is currently banned");
  }
}

async function createAuthResult(
  user: User,
  context: RequestContext,
  rememberMe: boolean
): Promise<AuthResult> {
  const tokens = await createSessionTokens({
    context,
    rememberMe,
    user: {
      id: user.id,
      role: user.role
    }
  });

  return {
    tokens,
    user: toPublicAuthUser(user)
  };
}

export async function signup(input: SignupInput, context: RequestContext): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existing) {
    throw new HttpError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "An account with this email already exists"
    );
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      settings: {
        create: {}
      }
    }
  });

  await createAuditLog({
    action: "USER_CREATED",
    context,
    entity: "User",
    entityId: user.id,
    userId: user.id
  });

  return createAuthResult(user, context, input.rememberMe);
}

export async function login(input: LoginInput, context: RequestContext): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user?.passwordHash) {
    throw invalidCredentialsError;
  }

  ensureUserCanAuthenticate(user);

  const passwordMatches = await argon2.verify(user.passwordHash, input.password);

  if (!passwordMatches) {
    throw invalidCredentialsError;
  }

  await createAuditLog({
    action: "LOGIN",
    context,
    entity: "User",
    entityId: user.id,
    userId: user.id
  });

  return createAuthResult(user, context, input.rememberMe);
}

export async function loginWithGoogle(
  input: GoogleLoginInput,
  context: RequestContext
): Promise<AuthResult> {
  const profile = await verifyGoogleIdToken(input.idToken);
  const user = await prisma.user.upsert({
    create: {
      email: profile.email,
      emailVerifiedAt: new Date(),
      googleId: profile.googleId,
      name: profile.name,
      settings: {
        create: {}
      }
    },
    update: {
      emailVerifiedAt: new Date(),
      googleId: profile.googleId,
      name: profile.name ?? undefined
    },
    where: {
      email: profile.email
    }
  });

  ensureUserCanAuthenticate(user);

  await createAuditLog({
    action: "LOGIN",
    context,
    entity: "User",
    entityId: user.id,
    userId: user.id
  });

  return createAuthResult(user, context, input.rememberMe);
}

export async function requestEmailOtp(
  input: RequestOtpInput,
  context: RequestContext
): Promise<{ developmentOtp?: string; expiresInSeconds: number; status: "otp_queued" }> {
  const otp = createOtpCode();
  const expiresAt = addDuration(new Date(), "10m");

  await prisma.emailOtp.create({
    data: {
      codeHash: hashOtp(input.email, input.purpose, otp),
      email: input.email,
      expiresAt,
      purpose: input.purpose
    }
  });
  await sendOtpEmail(input.email, otp);

  await createAuditLog({
    action: "EMAIL_OTP_REQUESTED",
    context,
    entity: "EmailOtp",
    entityId: input.email
  });

  return {
    developmentOtp: env.NODE_ENV === "development" ? otp : undefined,
    expiresInSeconds: 600,
    status: "otp_queued"
  };
}

export async function verifyEmailOtp(
  input: VerifyOtpInput,
  context: RequestContext
): Promise<AuthResult> {
  const otpRecord = await prisma.emailOtp.findFirst({
    orderBy: {
      createdAt: "desc"
    },
    where: {
      consumedAt: null,
      email: input.email,
      expiresAt: {
        gt: new Date()
      },
      purpose: input.purpose
    }
  });

  if (!otpRecord) {
    throw new HttpError(401, "OTP_INVALID_OR_EXPIRED", "OTP is invalid or expired");
  }

  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    throw new HttpError(429, "OTP_ATTEMPTS_EXCEEDED", "OTP attempts exceeded");
  }

  const expectedHash = hashOtp(input.email, input.purpose, input.otp);

  if (otpRecord.codeHash !== expectedHash) {
    await prisma.emailOtp.update({
      data: {
        attempts: {
          increment: 1
        }
      },
      where: {
        id: otpRecord.id
      }
    });
    throw new HttpError(401, "OTP_INVALID_OR_EXPIRED", "OTP is invalid or expired");
  }

  const now = new Date();
  const user = await prisma.user.upsert({
    create: {
      email: input.email,
      emailVerifiedAt: now,
      settings: {
        create: {}
      }
    },
    update: {
      emailVerifiedAt: now
    },
    where: {
      email: input.email
    }
  });

  await prisma.emailOtp.update({
    data: {
      consumedAt: now
    },
    where: {
      id: otpRecord.id
    }
  });

  await createAuditLog({
    action: input.purpose === "EMAIL_VERIFICATION" ? "EMAIL_VERIFIED" : "EMAIL_OTP_VERIFIED",
    context,
    entity: "User",
    entityId: user.id,
    userId: user.id
  });

  return createAuthResult(user, context, true);
}

export async function forgotPassword(
  input: ForgotPasswordInput,
  context: RequestContext
): Promise<{ developmentResetToken?: string; status: "reset_queued" }> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user || user.deletedAt || user.isBanned) {
    return { status: "reset_queued" };
  }

  const resetToken = createRandomToken();
  const expiresAt = addDuration(new Date(), "30m");

  await prisma.passwordResetToken.create({
    data: {
      expiresAt,
      tokenHash: sha256(resetToken),
      userId: user.id
    }
  });

  const resetUrl = `${env.WEB_ORIGIN}/reset-password?token=${encodeURIComponent(resetToken)}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  await createAuditLog({
    action: "PASSWORD_RESET_REQUESTED",
    context,
    entity: "User",
    entityId: user.id,
    userId: user.id
  });

  return {
    developmentResetToken: env.NODE_ENV === "development" ? resetToken : undefined,
    status: "reset_queued"
  };
}

export async function resetPassword(
  input: ResetPasswordInput,
  context: RequestContext
): Promise<{ status: "password_reset" }> {
  const resetRecord = await prisma.passwordResetToken.findUnique({
    include: {
      user: true
    },
    where: {
      tokenHash: sha256(input.token)
    }
  });

  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= new Date()) {
    throw new HttpError(401, "RESET_TOKEN_INVALID", "Password reset token is invalid or expired");
  }

  const passwordHash = await argon2.hash(input.password);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      data: {
        passwordHash
      },
      where: {
        id: resetRecord.userId
      }
    }),
    prisma.passwordResetToken.update({
      data: {
        usedAt: now
      },
      where: {
        id: resetRecord.id
      }
    }),
    prisma.session.updateMany({
      data: {
        revokedAt: now
      },
      where: {
        userId: resetRecord.userId,
        revokedAt: null
      }
    }),
    prisma.refreshToken.updateMany({
      data: {
        revokedAt: now
      },
      where: {
        userId: resetRecord.userId,
        revokedAt: null
      }
    })
  ]);

  await createAuditLog({
    action: "PASSWORD_RESET_COMPLETED",
    context,
    entity: "User",
    entityId: resetRecord.userId,
    userId: resetRecord.userId
  });

  return { status: "password_reset" };
}

export async function refreshSession(
  refreshToken: string,
  context: RequestContext
): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub
    }
  });

  if (!user) {
    throw new HttpError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid");
  }

  ensureUserCanAuthenticate(user);

  const rotated = await rotateRefreshToken({
    context,
    refreshToken,
    userRole: user.role
  });

  await createAuditLog({
    action: "TOKEN_REFRESHED",
    context,
    entity: "Session",
    entityId: payload.sessionId,
    userId: user.id
  });

  return {
    tokens: {
      accessToken: rotated.accessToken,
      accessTokenExpiresAt: rotated.accessTokenExpiresAt,
      refreshToken: rotated.refreshToken,
      refreshTokenExpiresAt: rotated.refreshTokenExpiresAt
    },
    user: toPublicAuthUser(rotated.user)
  };
}

export async function logout(
  refreshToken: string | undefined,
  context: RequestContext
): Promise<void> {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const now = new Date();

    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        data: {
          revokedAt: now
        },
        where: {
          familyId: payload.familyId,
          revokedAt: null,
          userId: payload.sub
        }
      }),
      prisma.session.updateMany({
        data: {
          revokedAt: now
        },
        where: {
          id: payload.sessionId,
          revokedAt: null
        }
      })
    ]);

    await createAuditLog({
      action: "LOGOUT",
      context,
      entity: "Session",
      entityId: payload.sessionId,
      userId: payload.sub
    });
  } catch (error) {
    logger.warn({ error }, "Logout received an invalid refresh token");
  }
}
