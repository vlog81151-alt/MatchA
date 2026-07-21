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
import { signup } from "@/lib/auth-client";
import { signupFormSchema, type SignupFormValues } from "@/lib/auth-schemas";
import { routeAfterAuth } from "@/lib/profile-client";
import { useAuthStore } from "@/store/auth-store";

export default function SignupPage(): React.JSX.Element {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [formError, setFormError] = useState<string>();
  const form = useForm<SignupFormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
      rememberMe: true
    },
    resolver: zodResolver(signupFormSchema)
  });

  async function onSubmit(values: SignupFormValues): Promise<void> {
    setFormError(undefined);

    try {
      const result = await signup(values);
      setUser(result.user);
      router.push(routeAfterAuth(result.user.profileCompletion));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Signup failed");
    }
  }

  return (
    <AuthCard
      eyebrow="Start safely"
      subtitle="Create your account with strong password rules. Email verification follows immediately."
      title="Create your MatchA profile"
    >
      <form className="grid gap-4" onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <div>
          <label className="text-sm font-semibold text-royal-ink" htmlFor="name">
            Name
          </label>
          <Input id="name" autoComplete="name" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="mt-1 text-xs text-rose-700">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
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
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="mt-1 text-xs text-rose-700">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            className="h-4 w-4 rounded border-rose-200"
            type="checkbox"
            {...form.register("rememberMe")}
          />
          Keep me logged in on this device
        </label>
        <FormMessage error={formError} />
        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Creating..." : "Create account"}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-zinc-400">
        <span className="h-px flex-1 bg-rose-100" />
        or
        <span className="h-px flex-1 bg-rose-100" />
      </div>
      <GoogleOAuthButton />
      <p className="mt-5 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link className="font-semibold text-rose-700" href="/login">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
