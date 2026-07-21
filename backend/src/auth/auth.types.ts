import type { User } from "@prisma/client";

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface PublicAuthUser {
  email: string;
  emailVerifiedAt: string | null;
  id: string;
  name: string | null;
  profileCompletion: number;
  role: string;
  verificationStatus: string;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: PublicAuthUser;
}

export interface GoogleProfile {
  email: string;
  googleId: string;
  name: string | null;
  picture?: string;
}

export function toPublicAuthUser(user: User): PublicAuthUser {
  return {
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    id: user.id,
    name: user.name,
    profileCompletion: user.profileCompletion,
    role: user.role,
    verificationStatus: user.verificationStatus
  };
}
