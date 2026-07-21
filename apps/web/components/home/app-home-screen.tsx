"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CalendarHeart,
  Crown,
  Heart,
  MapPin,
  Music2,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import {
  getMatchingFilters,
  getRecommendations,
  likeProfile,
  passProfile,
  undoLastMatchingAction,
  updateMatchingFilters,
  type LikeType,
  type MatchingActionResponse,
  type MatchingFilters,
  type RecommendationProfile,
  type RecommendationQuery
} from "@/lib/matching-client";
import { getUnreadNotificationCount } from "@/lib/notification-client";
import { getProfile } from "@/lib/profile-client";

const featureCards = [
  {
    href: "/instant-date",
    icon: CalendarHeart,
    label: "instant date"
  },
  {
    href: "/concert-mode",
    icon: Music2,
    label: "concert mode"
  },
  {
    href: "/events",
    icon: CalendarDays,
    label: "events"
  }
];

const fallbackFilters: MatchingFilters = {
  maxAge: 35,
  maxDistanceKm: 25,
  minAge: 18,
  showDistance: true
};

function buildRecommendationQuery(filters: MatchingFilters): RecommendationQuery {
  return {
    ageMax: filters.maxAge,
    ageMin: filters.minAge,
    limit: 12,
    maxDistanceKm: filters.maxDistanceKm
  };
}

function formatEnum(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDistance(distanceKm: number | null): string | null {
  if (distanceKm === null) {
    return null;
  }

  if (distanceKm < 1) {
    return "nearby";
  }

  return `${Math.round(distanceKm)} km away`;
}

function getPrimaryPhoto(profile: RecommendationProfile | undefined) {
  return profile?.photos.find((photo) => photo.isPrimary) ?? profile?.photos[0];
}

function profileSubtitle(profile: RecommendationProfile): string {
  return [profile.profession, profile.city, formatDistance(profile.distanceKm)]
    .filter(Boolean)
    .join(" - ");
}

export function AppHomeScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const filtersInitialized = useRef(false);
  const [activeQuery, setActiveQuery] = useState<RecommendationQuery>({
    limit: 12
  });
  const [deck, setDeck] = useState<RecommendationProfile[]>([]);
  const [draftFilters, setDraftFilters] = useState<MatchingFilters>(fallbackFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [matchBanner, setMatchBanner] = useState<MatchingActionResponse["match"]>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const canLoadMatching = Boolean(
    profileQuery.data && profileQuery.data.profileCompletion >= 85 && !profileQuery.isError
  );
  const filtersQuery = useQuery({
    enabled: canLoadMatching,
    queryFn: getMatchingFilters,
    queryKey: ["matching", "filters"]
  });
  const recommendationsQuery = useQuery({
    enabled: canLoadMatching,
    queryFn: () => getRecommendations(activeQuery),
    queryKey: ["matching", "recommendations", activeQuery]
  });
  const unreadNotificationsQuery = useQuery({
    enabled: canLoadMatching,
    queryFn: getUnreadNotificationCount,
    queryKey: ["notifications", "unread-count"],
    refetchInterval: 30_000
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

  useEffect(() => {
    if (!filtersQuery.data || filtersInitialized.current) {
      return;
    }

    filtersInitialized.current = true;
    setDraftFilters(filtersQuery.data.filters);
    setActiveQuery(buildRecommendationQuery(filtersQuery.data.filters));
  }, [filtersQuery.data]);

  useEffect(() => {
    setDeck(recommendationsQuery.data?.recommendations ?? []);
  }, [recommendationsQuery.data]);

  const currentProfile = deck[0];
  const primaryPhoto = useMemo(() => getPrimaryPhoto(currentProfile), [currentProfile]);
  const visibleInterests = currentProfile?.interests.slice(0, 3) ?? [];

  const invalidateMatching = () => {
    void queryClient.invalidateQueries({
      queryKey: ["matching", "recommendations"]
    });
    void queryClient.invalidateQueries({
      queryKey: ["matching", "matches"]
    });
  };

  const likeMutation = useMutation({
    mutationFn: ({ targetUserId, type }: { targetUserId: string; type: LikeType }) =>
      likeProfile(targetUserId, type),
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
    onMutate: () => {
      setMatchBanner(null);
      setStatusMessage(null);
    },
    onSuccess: (result) => {
      setDeck((profiles) => profiles.slice(1));
      setMatchBanner(result.match ?? null);
      setStatusMessage(
        result.match
          ? "You both vibed. A match was created."
          : result.action === "SUPER_LIKE"
            ? "Main rizz sent."
            : "Vibe sent."
      );
      invalidateMatching();
    }
  });

  const passMutation = useMutation({
    mutationFn: passProfile,
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
    onMutate: () => {
      setMatchBanner(null);
      setStatusMessage(null);
    },
    onSuccess: () => {
      setDeck((profiles) => profiles.slice(1));
      setStatusMessage("Passed.");
      invalidateMatching();
    }
  });

  const undoMutation = useMutation({
    mutationFn: undoLastMatchingAction,
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
    onMutate: () => {
      setMatchBanner(null);
      setStatusMessage(null);
    },
    onSuccess: () => {
      setStatusMessage("Last action undone.");
      invalidateMatching();
    }
  });

  const filtersMutation = useMutation({
    mutationFn: updateMatchingFilters,
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
    onSuccess: (result) => {
      setDraftFilters(result.filters);
      setActiveQuery(buildRecommendationQuery(result.filters));
      setFiltersOpen(false);
      setStatusMessage("Filters updated.");
      void queryClient.invalidateQueries({
        queryKey: ["matching", "filters"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["matching", "recommendations"]
      });
    }
  });

  const actionPending =
    likeMutation.isPending ||
    passMutation.isPending ||
    undoMutation.isPending ||
    filtersMutation.isPending;
  const loading = profileQuery.isLoading || (canLoadMatching && recommendationsQuery.isLoading);

  function applyFilters() {
    filtersMutation.mutate(draftFilters);
  }

  function sendLike(type: LikeType) {
    if (!currentProfile) {
      return;
    }

    likeMutation.mutate({
      targetUserId: currentProfile.id,
      type
    });
  }

  function sendPass() {
    if (!currentProfile) {
      return;
    }

    passMutation.mutate(currentProfile.id);
  }

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button
            aria-label="Undo last match action"
            disabled={actionPending}
            onClick={() => undoMutation.mutate()}
            size="icon"
            type="button"
            variant="secondary"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button
            aria-label="Matching filters"
            onClick={() => setFiltersOpen((value) => !value)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
          <Button
            aria-label="Notifications"
            asChild
            className="relative"
            size="icon"
            type="button"
            variant="secondary"
          >
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              {(unreadNotificationsQuery.data?.unreadCount ?? 0) > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-700 px-1 text-[10px] font-bold text-white">
                  {Math.min(unreadNotificationsQuery.data?.unreadCount ?? 0, 9)}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-[460px] px-5">
        {statusMessage ? (
          <div className="mb-3 rounded-2xl border border-rose-100 bg-white/75 px-4 py-3 text-sm font-medium text-royal-ink shadow-glass">
            {statusMessage}
          </div>
        ) : null}

        {matchBanner ? (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-gold px-4 py-3 text-sm font-semibold text-white shadow-aura">
            MatchA with {matchBanner.profile.name ?? "your new match"} -{" "}
            {matchBanner.compatibilityScore}% vibe
          </div>
        ) : null}

        {filtersOpen ? (
          <FloralFrame className="mb-4 p-4">
            <div className="grid gap-4 rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs font-semibold text-zinc-600">
                  min age
                  <input
                    className="h-11 rounded-xl border border-rose-100 bg-cream-50 px-3 text-sm text-royal-ink outline-none focus:border-rose-400"
                    max={draftFilters.maxAge}
                    min={18}
                    onChange={(event) =>
                      setDraftFilters((filters) => ({
                        ...filters,
                        minAge: Number(event.target.value)
                      }))
                    }
                    type="number"
                    value={draftFilters.minAge}
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-zinc-600">
                  max age
                  <input
                    className="h-11 rounded-xl border border-rose-100 bg-cream-50 px-3 text-sm text-royal-ink outline-none focus:border-rose-400"
                    max={80}
                    min={draftFilters.minAge}
                    onChange={(event) =>
                      setDraftFilters((filters) => ({
                        ...filters,
                        maxAge: Number(event.target.value)
                      }))
                    }
                    type="number"
                    value={draftFilters.maxAge}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-xs font-semibold text-zinc-600">
                distance {draftFilters.maxDistanceKm} km
                <input
                  aria-label="Maximum distance"
                  className="accent-rose-700"
                  max={100}
                  min={1}
                  onChange={(event) =>
                    setDraftFilters((filters) => ({
                      ...filters,
                      maxDistanceKm: Number(event.target.value)
                    }))
                  }
                  type="range"
                  value={draftFilters.maxDistanceKm}
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-rose-100 bg-cream-50 px-3 py-3 text-sm font-semibold text-royal-ink">
                show distance
                <input
                  checked={draftFilters.showDistance}
                  className="h-5 w-5 accent-rose-700"
                  onChange={(event) =>
                    setDraftFilters((filters) => ({
                      ...filters,
                      showDistance: event.target.checked
                    }))
                  }
                  type="checkbox"
                />
              </label>
              <Button disabled={actionPending} onClick={applyFilters} type="button">
                apply filters
              </Button>
            </div>
          </FloralFrame>
        ) : null}

        <FloralFrame className="p-3">
          <div className="overflow-hidden rounded-[1.6rem] border border-rose-100 bg-cream-50/90">
            {loading ? (
              <div className="grid min-h-[620px] place-items-center px-6 text-center text-sm font-medium text-royal-ink">
                Finding people with real chemistry
              </div>
            ) : currentProfile ? (
              <>
                <div className="relative">
                  {primaryPhoto ? (
                    <img
                      alt={currentProfile.name ?? "MatchA profile"}
                      className="h-[390px] w-full object-cover"
                      src={primaryPhoto.url}
                    />
                  ) : (
                    <div className="grid h-[390px] place-items-center bg-rose-50 text-rose-700">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute right-4 top-4 rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-3 text-center shadow-glass">
                    <p className="font-display text-3xl text-rose-700">
                      {currentProfile.compatibilityScore}%
                    </p>
                    <p className="text-xs text-zinc-600">vibe match</p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="font-display text-3xl text-royal-ink">
                        {currentProfile.name ?? "MatchA"}
                        {currentProfile.age ? `, ${currentProfile.age}` : ""}
                      </h1>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-zinc-600">
                        {profileSubtitle(currentProfile)}
                      </p>
                    </div>
                    <Badge className="gap-1 capitalize">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {formatEnum(currentProfile.verificationStatus)}
                    </Badge>
                  </div>

                  <p className="mt-4 min-h-[48px] text-sm leading-6 text-royal-ink">
                    {currentProfile.bio ??
                      "Here for thoughtful plans, clear intent, and easy conversation."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentProfile.relationshipGoal ? (
                      <Badge className="gap-1 bg-white">
                        <Crown className="h-3.5 w-3.5" />
                        {formatEnum(currentProfile.relationshipGoal)}
                      </Badge>
                    ) : null}
                    {currentProfile.city ? (
                      <Badge className="gap-1 bg-white">
                        <MapPin className="h-3.5 w-3.5" />
                        {currentProfile.city}
                      </Badge>
                    ) : null}
                    {visibleInterests.map((interest) => (
                      <Badge key={interest.id}>#{interest.name.toLowerCase()}</Badge>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-3 items-end gap-3 text-center text-xs text-zinc-600">
                    <button
                      className="grid gap-2 justify-items-center disabled:opacity-50"
                      disabled={actionPending}
                      onClick={sendPass}
                      type="button"
                    >
                      <span className="grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-white text-rose-700">
                        <X className="h-6 w-6" />
                      </span>
                      pass
                    </button>
                    <button
                      className="grid gap-2 justify-items-center disabled:opacity-50"
                      disabled={actionPending}
                      onClick={() => sendLike("LIKE")}
                      type="button"
                    >
                      <span className="grid h-20 w-20 place-items-center rounded-full border-8 border-rose-200 bg-rose-gold text-white shadow-aura">
                        <Heart className="h-8 w-8 fill-current" />
                      </span>
                      vibed
                    </button>
                    <button
                      className="grid gap-2 justify-items-center disabled:opacity-50"
                      disabled={actionPending}
                      onClick={() => sendLike("SUPER_LIKE")}
                      type="button"
                    >
                      <span className="grid h-14 w-14 place-items-center rounded-full border border-rose-100 bg-white text-royal-gold">
                        <Sparkles className="h-6 w-6" />
                      </span>
                      main rizz
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid min-h-[620px] place-items-center px-6 text-center">
                <div>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-white text-rose-700 shadow-glass">
                    <Heart className="h-8 w-8" />
                  </div>
                  <h1 className="mt-5 font-display text-3xl text-royal-ink">
                    Fresh matches are resting
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    Widen your filters or check back soon for more Jaipur-hearted profiles.
                  </p>
                  <Button className="mt-5" onClick={() => setFiltersOpen(true)} type="button">
                    adjust filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </FloralFrame>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {featureCards.map((item) => (
            <Link
              className="grid min-h-24 place-items-center gap-2 rounded-2xl border border-rose-100 bg-white/70 p-3 text-center text-xs font-semibold text-royal-ink shadow-glass"
              href={item.href}
              key={item.href}
            >
              <item.icon className="h-6 w-6 text-rose-700" />
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <AppBottomNav />
    </main>
  );
}
