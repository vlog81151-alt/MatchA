"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input } from "@matcha/ui";

import { AuthCard } from "@/components/auth/auth-card";
import { FormMessage } from "@/components/auth/form-message";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { login } from "@/lib/auth-client";
import { loginFormSchema, type LoginFormValues } from "@/lib/auth-schemas";
import { routeAfterAuth } from "@/lib/profile-client";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState<string>();
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    },
    resolver: zodResolver(loginFormSchema)
  });

  async function onSubmit(values: LoginFormValues): Promise<void> {
    setFormError(undefined);

    try {
      const result = await login(values);
      setUser(result.user);
      router.push(routeAfterAuth(result.user.profileCompletion));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <AuthCard
      eyebrow="Welcome back"
      subtitle="Login with password, Google, or email OTP. Refresh tokens are rotated securely."
      title="Login to MatchA"
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
        <div>
          <label className="text-sm font-semibold text-royal-ink" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="mt-1 text-xs text-rose-700">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-zinc-600">
            <input
              className="h-4 w-4 rounded border-rose-200"
              type="checkbox"
              {...form.register("rememberMe")}
            />
            Remember me
          </label>
          <Link className="font-semibold text-rose-700" href="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <FormMessage error={formError} />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-400">
        <span className="h-px flex-1 bg-rose-100" />
        or
        <span className="h-px flex-1 bg-rose-100" />
      </div>
      <GoogleOAuthButton />
      <div className="mt-5 grid gap-2 text-center text-sm">
        <Link className="font-semibold text-rose-700" href="/verify-otp">
          Login with email OTP
        </Link>
        <p className="text-zinc-600">
          New to MatchA?{" "}
          <Link className="font-semibold text-rose-700" href="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
