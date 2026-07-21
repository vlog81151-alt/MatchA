import Link from "next/link";
import { Button } from "@matcha/ui";

export default function NotFound(): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-md rounded-3xl border border-rose-200 bg-white/80 p-8 text-center shadow-aura">
        <p className="text-sm font-semibold uppercase tracking-normal text-rose-700">404</p>
        <h1 className="mt-3 font-display text-4xl text-royal-ink">This path is not a match.</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          The screen you are looking for does not exist yet or has moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/home">Return home</Link>
        </Button>
      </section>
    </main>
  );
}
