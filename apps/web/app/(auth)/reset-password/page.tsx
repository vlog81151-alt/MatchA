import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <AuthCard
          eyebrow="Secure reset"
          subtitle="Preparing your password reset form."
          title="Set a new password"
        >
          <div className="h-28 animate-pulse rounded-[18px] border border-rose-100 bg-white/50" />
        </AuthCard>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
