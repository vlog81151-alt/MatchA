"use client";

import Script from "next/script";
import { useState } from "react";
import { Button } from "@matcha/ui";

import { loginWithGoogle } from "@/lib/auth-client";
import { routeAfterAuth } from "@/lib/profile-client";
import { useAuthStore } from "@/store/auth-store";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            callback: (response: { credential?: string }) => void;
            client_id: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleOAuthButton(): React.JSX.Element {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  const configureGoogle = (): void => {
    if (!googleClientId || !window.google) {
      return;
    }

    window.google.accounts.id.initialize({
      callback: (response) => {
        void (async () => {
          if (!response.credential) {
            setError("Google did not return a credential.");
            return;
          }

          setPending(true);
          setError(null);

          try {
            const result = await loginWithGoogle(response.credential);
            setUser(result.user);
            window.location.href = routeAfterAuth(result.user.profileCompletion);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Google login failed");
          } finally {
            setPending(false);
          }
        })();
      },
      client_id: googleClientId
    });
    setReady(true);
  };

  return (
    <div className="grid gap-2">
      {googleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={configureGoogle}
        />
      ) : null}
      <Button
        className="w-full"
        disabled={!googleClientId || !ready || pending}
        type="button"
        variant="secondary"
        onClick={() => window.google?.accounts.id.prompt()}
      >
        {pending ? "Connecting..." : "Continue with Google"}
      </Button>
      {!googleClientId ? (
        <p className="text-center text-xs text-zinc-500">
          Google OAuth needs NEXT_PUBLIC_GOOGLE_CLIENT_ID.
        </p>
      ) : null}
      {error ? <p className="text-center text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
