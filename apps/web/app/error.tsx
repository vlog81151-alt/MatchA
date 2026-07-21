"use client";

import { useEffect } from "react";
import { Button } from "@matcha/ui";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-md rounded-3xl border border-rose-200 bg-white/80 p-8 text-center shadow-aura">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">
          Something broke
        </p>
        <h1 className="mt-3 font-display text-4xl text-royal-ink">We lost the thread.</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          MatchA could not complete this view. Retry once; if it persists, our audit logs will help
          trace the issue.
        </p>
        <Button className="mt-6" onClick={reset}>
          Retry
        </Button>
      </section>
    </main>
  );
}
