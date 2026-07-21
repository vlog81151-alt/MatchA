"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, ShieldCheck, User } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import { getMatches, type MatchCard } from "@/lib/matching-client";
import { getProfile } from "@/lib/profile-client";

function getPrimaryPhoto(match: MatchCard) {
  return match.profile.photos.find((photo) => photo.isPrimary) ?? match.profile.photos[0];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function MatchesScreen(): React.JSX.Element {
  const router = useRouter();
  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const matchesQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: getMatches,
    queryKey: ["matching", "matches"]
  });

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace("/login");
      return;
    }

    if (profileQuery.data && profileQuery.data.profileCompletion < 85) {
      router.replace("/onboarding");
    }
  }, [profileQuery.data, profileQuery.isError, router]);

  const matches = matchesQuery.data?.matches ?? [];
  const loading = profileQuery.isLoading || matchesQuery.isLoading;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-5">
        <Button aria-label="Back to home" asChild size="icon" type="button" variant="secondary">
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Logo />
        <div className="h-11 w-11" />
      </header>

      <section className="mx-auto max-w-[460px] px-5">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-700">MatchA</p>
          <h1 className="font-display text-4xl text-royal-ink">your matches</h1>
        </div>

        {loading ? (
          <FloralFrame className="p-4">
            <div className="grid min-h-[360px] place-items-center rounded-[1.4rem] border border-rose-100 bg-white/75 text-sm font-medium text-royal-ink">
              Loading matches
            </div>
          </FloralFrame>
        ) : matches.length > 0 ? (
          <div className="grid gap-3">
            {matches.map((match) => {
              const photo = getPrimaryPhoto(match);

              return (
                <FloralFrame className="p-2" key={match.id}>
                  <article className="grid grid-cols-[88px_1fr] gap-4 rounded-[1.3rem] border border-rose-100 bg-white/80 p-3">
                    <div className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
                      {photo ? (
                        <img
                          alt={match.profile.name ?? "MatchA match"}
                          className="h-24 w-full object-cover"
                          src={photo.url}
                        />
                      ) : (
                        <div className="grid h-24 place-items-center text-rose-700">
                          <User className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-display text-2xl text-royal-ink">
                            {match.profile.name ?? "MatchA"}
                            {match.profile.age ? `, ${match.profile.age}` : ""}
                          </h2>
                          <p className="truncate text-xs text-zinc-600">
                            {[match.profile.profession, match.profile.city]
                              .filter(Boolean)
                              .join(" - ")}
                          </p>
                        </div>
                        <Badge className="shrink-0 gap-1 bg-rose-50">
                          <Heart className="h-3.5 w-3.5 fill-current" />
                          {match.compatibilityScore}%
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="gap-1 bg-white">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {formatEnum(match.profile.verificationStatus)}
                        </Badge>
                        <Badge className="bg-white">{formatDate(match.matchedAt)}</Badge>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-5 text-royal-ink">
                        {match.latestMessage?.body ??
                          match.profile.bio ??
                          "Start with something warm and specific."}
                      </p>

                      <Button asChild className="mt-4 w-full" size="sm" variant="secondary">
                        <Link href={`/chats/${match.id}`}>
                          <MessageCircle className="h-4 w-4" />
                          chat
                        </Link>
                      </Button>
                    </div>
                  </article>
                </FloralFrame>
              );
            })}
          </div>
        ) : (
          <FloralFrame className="p-4">
            <div className="grid min-h-[360px] place-items-center rounded-[1.4rem] border border-rose-100 bg-white/75 px-6 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-white text-rose-700 shadow-glass">
                  <Heart className="h-8 w-8" />
                </div>
                <h2 className="mt-5 font-display text-3xl text-royal-ink">No mutual vibes yet</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Keep exploring profiles. Mutual likes will appear here with chat ready.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/home">discover profiles</Link>
                </Button>
              </div>
            </div>
          </FloralFrame>
        )}
      </section>

      <AppBottomNav />
    </main>
  );
}
