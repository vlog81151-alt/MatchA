import type {
  ForgotPasswordFormValues,
  LoginFormValues,
  OtpRequestFormValues,
  OtpVerifyFormValues,
  ResetPasswordFormValues,
  SignupFormValues
} from "./auth-schemas";
import { requestJson } from "./http-client";

export interface AuthUser {
  email: string;
  emailVerifiedAt: string | null;
  id: string;
  name: string | null;
  profileCompletion: number;
  role: string;
  verificationStatus: string;
}

export interface AuthResponse {
  tokens: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
  };
  user: AuthUser;
}

export function signup(values: SignupFormValues): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/signup", {
    body: JSON.stringify(values),
    method: "POST"
  });
}

export function login(values: LoginFormValues): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/login", {
    body: JSON.stringify(values),
    method: "POST"
  });
}

export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/google", {
    body: JSON.stringify({
      idToken,
      rememberMe: true
    }),
    method: "POST"
  });
}

export function requestOtp(values: OtpRequestFormValues): Promise<{
  developmentOtp?: string;
  expiresInSeconds: number;
  status: "otp_queued";
}> {
  return requestJson("/auth/otp/request", {
    body: JSON.stringify(values),
    method: "POST"
  });
}

export function verifyOtp(values: OtpVerifyFormValues): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/otp/verify", {
    body: JSON.stringify(values),
    method: "POST"
  });
}

export function forgotPassword(values: ForgotPasswordFormValues): Promise<{
  developmentResetToken?: string;
  status: "reset_queued";
}> {
  return requestJson("/auth/forgot-password", {
    body: JSON.stringify(values),
    method: "POST"
  });
}

export function resetPassword(
  values: ResetPasswordFormValues
): Promise<{ status: "password_reset" }> {
  return requestJson("/auth/reset-password", {
    body: JSON.stringify(values),
    method: "POST"
  });
}

export function logout(): Promise<void> {
  return requestJson<void>("/auth/logout", {
    method: "POST"
  });
}
