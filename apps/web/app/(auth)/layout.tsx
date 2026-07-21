import Link from "next/link";
import { Logo } from "@matcha/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="hidden min-h-screen bg-royal-night p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo className="text-white [&_span:last-child]:text-white [&_span:first-child]:bg-white/10 [&_span:first-child]:text-white" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-100">
            MatchA Authentication
          </p>
          <h1 className="mt-5 max-w-xl font-display text-6xl leading-none">
            Secure entry for real chemistry.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-rose-50/85">
            Email OTP, refresh-token rotation, Google OAuth, and safety-aware sessions are built
            into the platform foundation.
          </p>
        </div>
        <p className="text-xs text-rose-50/70">
          Jaipur-inspired. Privacy-first. Ready for mobile reuse.
        </p>
      </section>

      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" aria-label="MatchA home">
            <Logo />
          </Link>
          <Link className="text-sm font-semibold text-rose-700" href="/">
            Back home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">{children}</div>
      </section>
    </main>
  );
}
