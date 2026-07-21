import { Router, type Request, type Router as ExpressRouter } from "express";

import {
  forgotPassword,
  login,
  loginWithGoogle,
  logout,
  refreshSession,
  requestEmailOtp,
  resetPassword,
  signup,
  verifyEmailOtp
} from "../auth/auth.service.js";
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  refreshTokenSchema,
  requestOtpSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema
} from "../auth/auth.schemas.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from "../auth/cookie.service.js";
import { asyncHandler } from "../lib/async-handler.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter: ExpressRouter = Router();

function requestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}

function readSignedCookie(request: Request, name: string): string | undefined {
  const signedCookies = request.signedCookies as Record<string, unknown> | undefined;
  const value = signedCookies?.[name];

  return typeof value === "string" ? value : undefined;
}

function readRefreshToken(request: Request): string | undefined {
  const parsed = refreshTokenSchema.safeParse(request.body ?? {});

  return (
    (parsed.success ? parsed.data.refreshToken : undefined) ??
    readSignedCookie(request, REFRESH_TOKEN_COOKIE)
  );
}

authRouter.post(
  "/signup",
  validateBody(signupSchema),
  asyncHandler(async (request, response) => {
    const body = signupSchema.parse(request.body);
    const result = await signup(body, requestContext(request));

    setAuthCookies(response, result.tokens);
    response.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const body = loginSchema.parse(request.body);
    const result = await login(body, requestContext(request));

    setAuthCookies(response, result.tokens);
    response.json(result);
  })
);

authRouter.post(
  "/google",
  validateBody(googleLoginSchema),
  asyncHandler(async (request, response) => {
    const body = googleLoginSchema.parse(request.body);
    const result = await loginWithGoogle(body, requestContext(request));

    setAuthCookies(response, result.tokens);
    response.json(result);
  })
);

authRouter.post(
  "/otp/request",
  validateBody(requestOtpSchema),
  asyncHandler(async (request, response) => {
    const body = requestOtpSchema.parse(request.body);
    const result = await requestEmailOtp(body, requestContext(request));

    response.status(202).json(result);
  })
);

authRouter.post(
  "/otp/verify",
  validateBody(verifyOtpSchema),
  asyncHandler(async (request, response) => {
    const body = verifyOtpSchema.parse(request.body);
    const result = await verifyEmailOtp(body, requestContext(request));

    setAuthCookies(response, result.tokens);
    response.json(result);
  })
);

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (request, response) => {
    const body = forgotPasswordSchema.parse(request.body);
    const result = await forgotPassword(body, requestContext(request));

    response.status(202).json(result);
  })
);

authRouter.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(async (request, response) => {
    const body = resetPasswordSchema.parse(request.body);
    const result = await resetPassword(body, requestContext(request));

    clearAuthCookies(response);
    response.json(result);
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const refreshToken = readRefreshToken(request);

    if (!refreshToken) {
      response.status(401).json({
        error: {
          code: "REFRESH_TOKEN_MISSING",
          message: "Refresh token is required",
          requestId: request.id
        }
      });
      return;
    }

    const result = await refreshSession(refreshToken, requestContext(request));

    setAuthCookies(response, result.tokens);
    response.json(result);
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    await logout(readRefreshToken(request), requestContext(request));
    clearAuthCookies(response);
    response.status(204).send();
  })
);

authRouter.get("/me", requireAuth, (request, response) => {
  response.json({
    user: request.user
  });
});
