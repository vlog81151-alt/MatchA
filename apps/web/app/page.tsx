import Link from "next/link";
import {
  Bell,
  CalendarHeart,
  CheckCircle2,
  Heart,
  Music2,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";

import { AnimatedSection } from "@/components/animated-section";
import { Badge, Button, Card, FloralFrame, Logo } from "@matcha/ui";

const features = [
  {
    icon: Heart,
    title: "Vibe-first matching",
    copy: "Compatibility signals blend intent, interests, lifestyle, and verified profile quality."
  },
  {
    icon: CalendarHeart,
    title: "Instant Date",
    copy: "Users who want the same nearby plan can match, chat, and meet safely with clear boundaries."
  },
  {
    icon: Music2,
    title: "Concert Mode",
    copy: "Find a concert buddy, new friends, or maybe more around Jaipur and major event cities."
  },
  {
    icon: ShieldCheck,
    title: "Respect-first safety",
    copy: "Verification, reporting, audit logs, and privacy controls are part of the platform foundation."
  }
];

const testimonials = [
  {
    name: "Aarohi",
    quote: "The app feels premium without feeling cold. I loved that it starts with real intent."
  },
  {
    name: "Raghav",
    quote: "Concert Mode is exactly how people in Jaipur actually make plans."
  },
  {
    name: "Meera",
    quote: "The safety-first flow makes dating feel less random and more respectful."
  }
];

const faq = [
  {
    q: "Is MatchA only for Jaipur?",
    a: "The brand is Jaipur-inspired, but the architecture supports multiple cities and location-aware matching."
  },
  {
    q: "Will users need verification?",
    a: "Phase 1 sets the foundation. Verification, ID review, and selfie match flows arrive in later phases."
  },
  {
    q: "Can this become a mobile app?",
    a: "Yes. Business logic is kept independent from UI so React Native or Expo can reuse core contracts."
  }
];

export default function HomePage(): React.JSX.Element {
  return (
    <main className="overflow-hidden">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-royal-ink/80 md:flex">
          <a href="#features">Features</a>
          <a href="#safety">Safety</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <Badge>Jaipur-inspired dating platform</Badge>
          <h1 className="mt-6 max-w-3xl text-balance font-display text-5xl leading-[0.95] text-royal-ink sm:text-6xl lg:text-7xl">
            Less cringe, more chemistry, with royal energy.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
            MatchA blends premium design, safety-first matching, Instant Date, Concert Mode, and
            respectful social discovery into one mobile-first dating experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Create profile</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            {[
              ["92%", "vibe match"],
              ["12m", "instant window"],
              ["24/7", "safety tooling"]
            ].map(([value, label]) => (
              <div
                className="rounded-2xl border border-rose-100 bg-white/60 p-4 shadow-glass"
                key={label}
              >
                <dt className="font-display text-3xl text-rose-700">{value}</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <FloralFrame className="mx-auto w-full max-w-[430px] p-4 sm:p-5">
          <div className="rounded-[1.7rem] border border-rose-200 bg-cream-50/90 p-4 shadow-glass">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-500">less cringe, more chemistry</p>
                <p className="font-display text-4xl text-royal-ink">MatchA</p>
              </div>
              <button
                aria-label="Notifications"
                className="relative grid h-11 w-11 place-items-center rounded-xl border border-rose-100 bg-white/70"
                type="button"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500" />
              </button>
            </div>
            <div className="relative mt-5 overflow-hidden rounded-[2rem] border border-royal-gold/50 bg-gradient-to-br from-[#b9d4dc] via-[#f3c2a1] to-[#ffe8c9] pt-10">
              <div className="absolute right-4 top-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-center">
                <p className="font-display text-3xl text-rose-700">92%</p>
                <p className="text-xs text-zinc-600">vibe match</p>
              </div>
              <div className="mx-auto grid h-64 w-64 place-items-end rounded-full bg-[#d79272]/60">
                <div className="mb-2 h-44 w-44 rounded-full bg-[#8b4b32] shadow-aura">
                  <div className="mx-auto mt-12 h-10 w-28 rounded-full border-[10px] border-[#1f2736]" />
                  <div className="mx-auto mt-8 h-6 w-24 rounded-b-full bg-white" />
                </div>
              </div>
            </div>
            <Card className="-mt-8 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-royal-ink">
                    Arjun, 22 <CheckCircle2 className="inline h-5 w-5 fill-royal-sage text-white" />
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">designer · jaipur</p>
                  <p className="mt-3 max-w-[24ch] text-sm leading-6 text-royal-ink">
                    good music, old city walks and random coffee dates
                  </p>
                </div>
                <Badge className="grid max-w-20 place-items-center text-center">
                  certified rizz
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>#sarcastic</Badge>
                <Badge>#old city</Badge>
                <Badge>#coffee</Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 items-end gap-3 text-center text-xs">
                <button className="grid gap-2 justify-items-center" type="button">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-white text-2xl text-rose-700">
                    x
                  </span>
                  pass
                </button>
                <button className="grid gap-2 justify-items-center" type="button">
                  <span className="grid h-20 w-20 place-items-center rounded-full border-8 border-rose-200 bg-rose-gold text-3xl text-white shadow-aura">
                    <Heart className="h-8 w-8" />
                  </span>
                  vibed
                </button>
                <button className="grid gap-2 justify-items-center" type="button">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-white text-2xl text-royal-gold">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  super like
                </button>
              </div>
            </Card>
          </div>
        </FloralFrame>
      </section>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="features">
        <div className="max-w-2xl">
          <Badge>Product modules</Badge>
          <h2 className="mt-4 font-display text-4xl text-royal-ink sm:text-5xl">
            Built for intent, not endless swipes.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card className="p-6" key={feature.title}>
              <feature.icon className="h-8 w-8 text-rose-700" />
              <h3 className="mt-5 font-display text-2xl text-royal-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{feature.copy}</p>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection
        className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8"
        id="how-it-works"
      >
        {[
          [
            "Create a verified profile",
            "Photos, interests, lifestyle, prompts, and safety preferences."
          ],
          [
            "Match by vibe",
            "Compatibility score and filters rank people who fit your actual intent."
          ],
          ["Move with safety", "Chat, plan, share location, report issues, and keep control."]
        ].map(([title, copy], index) => (
          <Card className="p-6" key={title}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 font-display text-xl text-rose-700">
              {index + 1}
            </span>
            <h3 className="mt-5 font-display text-2xl">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{copy}</p>
          </Card>
        ))}
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="safety">
        <FloralFrame className="p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge>Safety by design</Badge>
              <h2 className="mt-4 font-display text-4xl text-royal-ink">
                Trust is part of the product, not a later patch.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Photo and ID verification ready architecture",
                "Block, report, mute, and audit logs",
                "Emergency contact and SOS-ready flows",
                "Privacy controls for location and visibility"
              ].map((item) => (
                <div className="flex gap-3 rounded-2xl bg-white/65 p-4" key={item}>
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
                  <p className="text-sm leading-6 text-zinc-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </FloralFrame>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card className="p-6" key={testimonial.name}>
              <Star className="h-6 w-6 fill-royal-gold text-royal-gold" />
              <p className="mt-5 text-base leading-7 text-zinc-700">"{testimonial.quote}"</p>
              <p className="mt-5 font-semibold text-royal-ink">{testimonial.name}</p>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="pricing">
        <Card className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge>Pricing foundation</Badge>
            <h2 className="mt-4 font-display text-4xl text-royal-ink">
              Freemium now, premium signals later.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Phase 1 prepares the product for subscriptions, boosts, verified badges, and event
              partnerships without hard-coding monetization into core matching logic.
            </p>
          </div>
          <Button asChild size="lg" variant="royal">
            <Link href="/signup">Join waitlist</Link>
          </Button>
        </Card>
      </AnimatedSection>

      <AnimatedSection className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8" id="faq">
        <h2 className="text-center font-display text-4xl text-royal-ink">FAQ</h2>
        <div className="mt-8 grid gap-4">
          {faq.map((item) => (
            <Card className="p-6" key={item.q}>
              <h3 className="font-display text-2xl text-royal-ink">{item.q}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">{item.a}</p>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 text-sm text-zinc-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Logo />
        <div className="flex flex-wrap gap-5">
          <a href="mailto:hello@matcha.local">Contact</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>Built for Jaipur, ready for India.</span>
        </div>
      </footer>
    </main>
  );
}
