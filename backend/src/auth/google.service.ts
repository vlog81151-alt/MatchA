import { OAuth2Client } from "google-auth-library";

import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import type { GoogleProfile } from "./auth.types.js";

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    throw new HttpError(
      503,
      "GOOGLE_OAUTH_NOT_CONFIGURED",
      "Google OAuth is not configured for this environment"
    );
  }

  const ticket = await googleClient.verifyIdToken({
    audience: env.GOOGLE_CLIENT_ID,
    idToken
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub || payload.email_verified !== true) {
    throw new HttpError(401, "INVALID_GOOGLE_TOKEN", "Google token could not be verified");
  }

  return {
    email: payload.email.toLowerCase(),
    googleId: payload.sub,
    name: payload.name ?? null,
    picture: payload.picture
  };
}
