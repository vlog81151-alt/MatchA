"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "@matcha/ui";

import { AuthCard } from "@/components/auth/auth-card";
import { FormMessage } from "@/components/auth/form-message";
import { requestOtp, verifyOtp } from "@/lib/auth-client";
import {
  otpRequestFormSchema,
  otpVerifyFormSchema,
  type OtpRequestFormValues,
  type OtpVerifyFormValues
} from "@/lib/auth-schemas";
import { routeAfterAuth } from "@/lib/profile-client";
import { useAuthStore } from "@/store/auth-store";

export default function VerifyOtpPage(): React.JSX.Element {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [developmentOtp, setDevelopmentOtp] = useState<string>();
  const requestForm = useForm<OtpRequestFormValues>({
    defaultValues: {
      email: "",
      purpose: "EMAIL_LOGIN"
    },
    resolver: zodResolver(otpRequestFormSchema)
  });
  const verifyForm = useForm<OtpVerifyFormValues>({
    defaultValues: {
      email: "",
      otp: "",
      purpose: "EMAIL_LOGIN"
    },
    resolver: zodResolver(otpVerifyFormSchema)
  });

  async function onRequest(values: OtpRequestFormValues): Promise<void> {
    setFormError(undefined);
    setSuccess(undefined);
    setDevelopmentOtp(undefined);

    try {
      const result = await requestOtp(values);
      verifyForm.setValue("email", values.email);
      verifyForm.setValue("purpose", values.purpose);
      setDevelopmentOtp(result.developmentOtp);
      setSuccess("OTP sent. Check your email.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not send OTP");
    }
  }

  async function onVerify(values: OtpVerifyFormValues): Promise<void> {
    setFormError(undefined);

    try {
      const result = await verifyOtp(values);
      setUser(result.user);
      router.push(routeAfterAuth(result.user.profileCompletion));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "OTP verification failed");
    }
  }

  return (
    <AuthCard
      eyebrow="Email OTP"
      subtitle="Use email OTP for passwordless login or email verification. Codes expire in 10 minutes."
      title="Verify with OTP"
    >
      <div className="grid gap-6">
        <form
          className="grid gap-4"
          onSubmit={(event) => void requestForm.handleSubmit(onRequest)(event)}
        >
          <div>
            <label className="text-sm font-semibold text-royal-ink" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...requestForm.register("email")}
            />
            {requestForm.formState.errors.email ? (
              <p className="mt-1 text-xs text-rose-700">
                {requestForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <label className="text-sm font-semibold text-royal-ink" htmlFor="purpose">
            Purpose
          </label>
          <select
            className="h-11 rounded-xl border border-rose-100 bg-white/80 px-4 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            id="purpose"
            {...requestForm.register("purpose")}
          >
            <option value="EMAIL_LOGIN">Login with OTP</option>
            <option value="EMAIL_VERIFICATION">Verify email</option>
          </select>
          <Button disabled={requestForm.formState.isSubmitting} type="submit" variant="secondary">
            {requestForm.formState.isSubmitting ? "Sending..." : "Send OTP"}
          </Button>
        </form>

        <form
          className="grid gap-4"
          onSubmit={(event) => void verifyForm.handleSubmit(onVerify)(event)}
        >
          <div>
            <label className="text-sm font-semibold text-royal-ink" htmlFor="otp">
              6 digit OTP
            </label>
            <Input id="otp" inputMode="numeric" maxLength={6} {...verifyForm.register("otp")} />
            {verifyForm.formState.errors.otp ? (
              <p className="mt-1 text-xs text-rose-700">
                {verifyForm.formState.errors.otp.message}
              </p>
            ) : null}
          </div>
          <FormMessage error={formError} success={success} />
          {developmentOtp ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Development OTP: <strong>{developmentOtp}</strong>
            </p>
          ) : null}
          <Button disabled={verifyForm.formState.isSubmitting} type="submit">
            {verifyForm.formState.isSubmitting ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      </div>
      <p className="mt-5 text-center text-sm text-zinc-600">
        Prefer password?{" "}
        <Link className="font-semibold text-rose-700" href="/login">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
