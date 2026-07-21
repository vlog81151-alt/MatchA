"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  MapPin,
  Music2,
  Search,
  Settings2,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import {
  cancelConcertParticipation,
  confirmConcertMeetup,
  joinConcert,
  listConcerts,
  listMyConcerts,
  updateConcertIntent,
  type ConcertCard,
  type ConcertIntent
} from "@/lib/concert-client";
import { getProfile } from "@/lib/profile-client";

const genres = ["indie", "bollywood", "pop", "rock", "acoustic", "punjabi"];

const intentOptions: Array<{
  copy: string;
  label: string;
  value: ConcertIntent;
}> = [
  {
    copy: "let's enjoy the show",
    label: "concert buddy",
    value: "concert_buddy"
  },
  {
    copy: "group vibe",
    label: "new friends",
    value: "new_friends"
  },
  {
    copy: "let's see where it goes",
    label: "maybe more?",
    value: "maybe_more"
  }
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function formatIntent(value: string): string {
  return value.replaceAll("_", " ");
}

function primaryParticipantPhoto(concert: ConcertCard) {
  return concert.participantPreview[0]?.profile.photos.find((photo) => photo.isPrimary);
}

export function ConcertModeScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [city, setCity] = useState("Jaipur");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [intent, setIntent] = useState<ConcertIntent>("concert_buddy");
  const [selectedConcertId, setSelectedConcertId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const concertsQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: () =>
      listConcerts({
        city,
        genre: genre || undefined,
        limit: 20,
        q: search.trim() || undefined
      }),
    queryKey: ["concerts", city, genre, search.trim()]
  });
  const myConcertsQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: listMyConcerts,
    queryKey: ["concerts", "my"]
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

  const concerts = concertsQuery.data?.concerts ?? [];
  const selectedConcert = useMemo(
    () => concerts.find((concert) => concert.id === selectedConcertId) ?? concerts[0],
    [concerts, selectedConcertId]
  );
  const myConcertIds = useMemo(
    () => new Set((myConcertsQuery.data?.concerts ?? []).map((concert) => concert.id)),
    [myConcertsQuery.data?.concerts]
  );

  useEffect(() => {
    if (!selectedConcertId && concerts[0]) {
      setSelectedConcertId(concerts[0].id);
    }
  }, [concerts, selectedConcertId]);

  const invalidateConcerts = () => {
    void queryClient.invalidateQueries({
      queryKey: ["concerts"]
    });
  };

  const concertMutation = useMutation({
    mutationFn: async ({
      concertId,
      type
    }: {
      concertId: string;
      type: "cancel" | "confirm" | "intent" | "join";
    }) => {
      if (type === "cancel") {
        return cancelConcertParticipation(concertId);
      }

      if (type === "confirm") {
        return confirmConcertMeetup(concertId);
      }

      if (type === "intent") {
        return updateConcertIntent(concertId, {
          intent
        });
      }

      return joinConcert(concertId, {
        intent,
        status: "JOINED"
      });
    },
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: (_result, variables) => {
      setStatusMessage(
        variables.type === "cancel"
          ? "Concert plan cancelled."
          : variables.type === "confirm"
            ? "Meetup confirmed."
            : "Concert vibe saved."
      );
      invalidateConcerts();
    }
  });

  const pending = concertMutation.isPending;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-[860px] items-center justify-between px-5 py-5">
        <Button aria-label="Back to home" asChild size="icon" type="button" variant="secondary">
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Logo />
        <Button aria-label="Concert filters" size="icon" type="button" variant="secondary">
          <Settings2 className="h-5 w-5" />
        </Button>
      </header>

      <section className="mx-auto grid max-w-[860px] gap-5 px-5 lg:grid-cols-[1fr_220px]">
        <div>
          <div className="text-center">
            <p className="font-display text-4xl text-royal-ink">
              <Music2 className="mb-1 inline h-8 w-8 text-rose-700" /> concert mode{" "}
              <Music2 className="mb-1 inline h-8 w-8 text-rose-700" />
            </p>
            <p className="mt-2 text-sm leading-6 text-royal-ink">
              find your concert buddy or someone to vibe with at the show
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px]">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-rose-100 bg-white/75 px-4 text-sm text-zinc-600 shadow-glass">
              <Search className="h-5 w-5 text-rose-700" />
              <input
                className="min-w-0 flex-1 bg-transparent text-royal-ink outline-none placeholder:text-zinc-500"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="search concerts"
                type="search"
                value={search}
              />
            </label>
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-rose-100 bg-white/75 px-4 text-sm text-zinc-600 shadow-glass">
              <MapPin className="h-5 w-5 text-rose-700" />
              <input
                className="min-w-0 flex-1 bg-transparent text-royal-ink outline-none"
                onChange={(event) => setCity(event.target.value)}
                value={city}
              />
            </label>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {genres.map((item) => (
              <button
                className={
                  genre === item
                    ? "h-9 shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                    : "h-9 shrink-0 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
                }
                key={item}
                onClick={() => setGenre((value) => (value === item ? "" : item))}
                type="button"
              >
                #{item}
              </button>
            ))}
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm font-medium text-royal-ink shadow-glass">
              {statusMessage}
            </div>
          ) : null}

          {selectedConcert ? (
            <FeaturedConcert
              concert={selectedConcert}
              intent={intent}
              joined={myConcertIds.has(selectedConcert.id)}
              onAction={(type) => concertMutation.mutate({ concertId: selectedConcert.id, type })}
              pending={pending}
            />
          ) : (
            <FloralFrame className="mt-5 p-4">
              <div className="grid min-h-[260px] place-items-center rounded-[1.4rem] border border-rose-100 bg-white/80 text-center">
                <div>
                  <Music2 className="mx-auto h-10 w-10 text-rose-700" />
                  <p className="mt-3 font-display text-2xl text-royal-ink">No concerts found</p>
                </div>
              </div>
            </FloralFrame>
          )}

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-royal-ink">upcoming for you</h2>
              <span className="text-xs font-semibold text-rose-700">{concerts.length} found</span>
            </div>
            <div className="mt-3 grid gap-3">
              {concerts.map((concert) => (
                <button
                  className={
                    selectedConcert?.id === concert.id
                      ? "grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-2 text-left shadow-glass"
                      : "grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-rose-100 bg-white/75 p-2 text-left shadow-glass"
                  }
                  key={concert.id}
                  onClick={() => setSelectedConcertId(concert.id)}
                  type="button"
                >
                  <img
                    alt={concert.title}
                    className="h-16 w-full rounded-xl object-cover"
                    src={
                      concert.coverImage ??
                      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a"
                    }
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-xl text-royal-ink">
                      {concert.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-600">
                      {formatDate(concert.startsAt)} - {concert.venue}
                    </span>
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-rose-100 bg-white text-rose-700">
                    +
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <FloralFrame className="p-4">
            <div className="rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <h2 className="text-center font-display text-2xl text-royal-ink">your vibe</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(profileQuery.data?.music ?? []).slice(0, 4).map((item) => (
                  <Badge key={item}>#{item.toLowerCase()}</Badge>
                ))}
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => router.push("/profile")}
                type="button"
                variant="secondary"
              >
                edit
              </Button>
            </div>
          </FloralFrame>

          <FloralFrame className="p-4">
            <div className="rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <h2 className="text-center font-display text-2xl text-royal-ink">looking for</h2>
              <div className="mt-4 grid gap-2">
                {intentOptions.map((item) => (
                  <button
                    className={
                      intent === item.value
                        ? "rounded-2xl border border-rose-300 bg-rose-50 p-3 text-left"
                        : "rounded-2xl border border-rose-100 bg-white/75 p-3 text-left"
                    }
                    key={item.value}
                    onClick={() => setIntent(item.value)}
                    type="button"
                  >
                    <span className="block font-semibold text-royal-ink">{item.label}</span>
                    <span className="text-xs text-zinc-600">{item.copy}</span>
                  </button>
                ))}
              </div>
            </div>
          </FloralFrame>
        </aside>
      </section>

      <AppBottomNav />
    </main>
  );
}

function FeaturedConcert({
  concert,
  intent,
  joined,
  onAction,
  pending
}: {
  concert: ConcertCard;
  intent: ConcertIntent;
  joined: boolean;
  onAction: (type: "cancel" | "confirm" | "intent" | "join") => void;
  pending: boolean;
}): React.JSX.Element {
  const participantPhoto = primaryParticipantPhoto(concert);

  return (
    <FloralFrame className="mt-5 p-3">
      <article className="overflow-hidden rounded-[1.6rem] border border-rose-100 bg-white/80 shadow-glass">
        <div className="relative min-h-[260px]">
          <img
            alt={concert.title}
            className="absolute inset-0 h-full w-full object-cover"
            src={
              concert.coverImage ?? "https://images.unsplash.com/photo-1501386761578-eac5c94b800a"
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-royal-night/88 via-royal-night/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h1 className="font-display text-3xl">{concert.title}</h1>
            <p className="mt-1 text-sm">
              {formatDate(concert.startsAt)} - {concert.venue}, {concert.city}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {concert.participantPreview.slice(0, 3).map((participant) => {
                const photo = participant.profile.photos.find((item) => item.isPrimary);

                return photo ? (
                  <img
                    alt={participant.profile.name ?? "Attendee"}
                    className="h-9 w-9 rounded-full border-2 border-white object-cover"
                    key={participant.userId}
                    src={photo.url}
                  />
                ) : null;
              })}
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                +{Math.max(concert.attendeeCount - 3, 0)} going
              </span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {concert.genreTags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
            <Badge className="gap-1 bg-white">
              <Users className="h-3.5 w-3.5" />
              {concert.attendeeCount}
            </Badge>
          </div>

          <div className="mt-4 rounded-2xl border border-rose-100 bg-cream-50 p-3">
            <div className="flex items-center gap-3">
              {participantPhoto ? (
                <img
                  alt="Participant"
                  className="h-12 w-12 rounded-2xl object-cover"
                  src={participantPhoto.url}
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-rose-700">
                  <Music2 className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-royal-ink">
                  {joined ? "You are in Concert Mode" : "Find people before the show"}
                </p>
                <p className="text-xs text-zinc-600">Intent: {formatIntent(intent)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              disabled={pending}
              onClick={() => onAction(joined ? "intent" : "join")}
              type="button"
            >
              <CalendarPlus className="h-4 w-4" />
              {joined ? "update vibe" : "find my people"}
            </Button>
            <Button
              disabled={pending || !joined}
              onClick={() => onAction("confirm")}
              type="button"
              variant="secondary"
            >
              <CheckCircle2 className="h-4 w-4" />
              confirm meetup
            </Button>
            <Button
              disabled={pending || !joined}
              onClick={() => onAction("cancel")}
              type="button"
              variant="royal"
            >
              <X className="h-4 w-4" />
              leave mode
            </Button>
          </div>
        </div>
      </article>
    </FloralFrame>
  );
}
