"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "@matcha/ui";

import { AuthCard } from "@/components/auth/auth-card";
import { FormMessage } from "@/components/auth/form-message";
import { resetPassword } from "@/lib/auth-client";
import { resetPasswordFormSchema, type ResetPasswordFormValues } from "@/lib/auth-schemas";

export function ResetPasswordForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const form = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: "",
      token
    },
    resolver: zodResolver(resetPasswordFormSchema)
  });

  async function onSubmit(values: ResetPasswordFormValues): Promise<void> {
    setFormError(undefined);
    setSuccess(undefined);

    try {
      await resetPassword(values);
      setSuccess("Your password has been reset. You can login with the new password.");
      form.reset({
        password: "",
        token: values.token
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Password reset failed");
    }
  }

  return (
    <AuthCard
      eyebrow="Secure reset"
      subtitle="Choose a strong password. Existing sessions are revoked after reset."
      title="Set a new password"
    >
      <form className="grid gap-4" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <input type="hidden" {...form.register("token")} />
        <div>
          <label className="text-sm font-semibold text-royal-ink" htmlFor="password">
            New password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="mt-1 text-xs text-rose-700">{form.formState.errors.password.message}</p>
          ) : null}
          {form.formState.errors.token ? (
            <p className="mt-1 text-xs text-rose-700">{form.formState.errors.token.message}</p>
          ) : null}
        </div>
        <FormMessage error={formError} success={success} />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Saving..." : "Reset password"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-600">
        Ready to return?{" "}
        <Link className="font-semibold text-rose-700" href="/login">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
