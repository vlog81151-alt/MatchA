import { FloralFrame } from "@matcha/ui";

export function AuthCard({
  children,
  eyebrow,
  subtitle,
  title
}: {
  children: React.ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}): React.JSX.Element {
  return (
    <FloralFrame className="w-full max-w-md p-4">
      <div className="rounded-[1.4rem] border border-rose-100 bg-white/82 p-6 shadow-glass backdrop-blur-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-700">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-royal-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </FloralFrame>
  );
}
