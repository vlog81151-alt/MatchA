"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "@matcha/ui";

import { AuthCard } from "@/components/auth/auth-card";
import { FormMessage } from "@/components/auth/form-message";
import { forgotPassword } from "@/lib/auth-client";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "@/lib/auth-schemas";

export default function ForgotPasswordPage(): React.JSX.Element {
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [developmentResetToken, setDevelopmentResetToken] = useState<string>();
  const form = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: ""
    },
    resolver: zodResolver(forgotPasswordFormSchema)
  });

  async function onSubmit(values: ForgotPasswordFormValues): Promise<void> {
    setFormError(undefined);
    setSuccess(undefined);
    setDevelopmentResetToken(undefined);

    try {
      const result = await forgotPassword(values);
      setDevelopmentResetToken(result.developmentResetToken);
      setSuccess("If an account exists, a password reset link has been sent.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Reset request failed");
    }
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      subtitle="Password reset links are single-use, hashed at rest, and expire quickly."
      title="Reset your password"
    >
      <form className="grid gap-4" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <div>
          <label className="text-sm font-semibold text-royal-ink" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email ? (
            <p className="mt-1 text-xs text-rose-700">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <FormMessage error={formError} success={success} />
        {developmentResetToken ? (
          <Link
            className="text-sm font-semibold text-rose-700"
            href={`/reset-password?token=${developmentResetToken}`}
          >
            Open development reset link
          </Link>
        ) : null}
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-600">
        Remembered it?{" "}
        <Link className="font-semibold text-rose-700" href="/login">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
