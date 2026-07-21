"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  Clapperboard,
  HandHeart,
  Loader2,
  MapPin,
  PartyPopper,
  Search,
  Send,
  Share2,
  Sparkles,
  Theater,
  Users,
  Utensils,
  Wrench,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import {
  cancelEventParticipation,
  inviteUserToEvent,
  joinEvent,
  listEvents,
  listMyEvents,
  type EventCard,
  type EventCategory
} from "@/lib/event-client";
import { getProfile } from "@/lib/profile-client";

const categoryOptions: Array<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: EventCategory;
}> = [
  {
    icon: BookOpenText,
    label: "book clubs",
    value: "BOOK_CLUB"
  },
  {
    icon: Utensils,
    label: "food festivals",
    value: "FOOD_FESTIVAL"
  },
  {
    icon: Theater,
    label: "comedy",
    value: "COMEDY"
  },
  {
    icon: Clapperboard,
    label: "movies",
    value: "MOVIE"
  },
  {
    icon: Wrench,
    label: "workshops",
    value: "WORKSHOP"
  },
  {
    icon: Users,
    label: "community",
    value: "COMMUNITY"
  },
  {
    icon: PartyPopper,
    label: "concerts",
    value: "CONCERT"
  }
];

const fallbackImages: Record<EventCategory, string> = {
  BOOK_CLUB: "https://images.unsplash.com/photo-1519682337058-a94d519337bc",
  COMEDY: "https://images.unsplash.com/photo-1527224857830-43a7acc85260",
  COMMUNITY: "https://images.unsplash.com/photo-1599661046827-dacde6976549",
  CONCERT: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
  FOOD_FESTIVAL: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
  MOVIE: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
  WORKSHOP: "https://images.unsplash.com/photo-1517048676732-d65bc937f952"
};

function formatCategory(value: EventCategory): string {
  return categoryOptions.find((item) => item.value === value)?.label ?? value.toLowerCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function formatRange(event: EventCard): string {
  if (!event.endsAt) {
    return formatDate(event.startsAt);
  }

  return `${formatDate(event.startsAt)} - ${new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(event.endsAt))}`;
}

function eventImage(event: EventCard): string {
  return event.coverImage ?? fallbackImages[event.category];
}

function primaryParticipantPhoto(event: EventCard) {
  return event.participantPreview[0]?.profile.photos.find((photo) => photo.isPrimary);
}

function sharePayload(event: EventCard) {
  const url = `${window.location.origin}/events`;

  return {
    text: `${event.title} at ${event.venue}, ${event.city}`,
    title: event.title,
    url
  };
}

export function EventsScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [city, setCity] = useState("Jaipur");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const eventsQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: () =>
      listEvents({
        category: category || undefined,
        city,
        limit: 30,
        q: search.trim() || undefined
      }),
    queryKey: ["events", city, category, search.trim()]
  });
  const myEventsQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: listMyEvents,
    queryKey: ["events", "my"]
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

  const events = eventsQuery.data?.events ?? [];
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? events[0],
    [events, selectedEventId]
  );
  const myEventIds = useMemo(
    () => new Set((myEventsQuery.data?.events ?? []).map((event) => event.id)),
    [myEventsQuery.data?.events]
  );

  useEffect(() => {
    if (!selectedEventId && events[0]) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const invalidateEvents = () => {
    void queryClient.invalidateQueries({
      queryKey: ["events"]
    });
  };

  const eventMutation = useMutation({
    mutationFn: async ({
      event,
      type
    }: {
      event: EventCard;
      type: "cancel" | "interested" | "invite" | "join";
    }) => {
      if (type === "cancel") {
        return cancelEventParticipation(event.id);
      }

      if (type === "invite") {
        const target = event.participantPreview.find(
          (participant) => participant.userId !== profileQuery.data?.id
        );

        if (!target) {
          throw new Error("No member is available to invite yet.");
        }

        return inviteUserToEvent(event.id, {
          message: `Join me for ${event.title} at ${event.venue}.`,
          recipientUserId: target.userId
        });
      }

      return joinEvent(event.id, {
        status: type === "join" ? "JOINED" : "INTERESTED"
      });
    },
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: (_result, variables) => {
      setStatusMessage(
        variables.type === "cancel"
          ? "Event plan cancelled."
          : variables.type === "invite"
            ? "Invite sent."
            : variables.type === "interested"
              ? "Marked interested."
              : "You joined the event."
      );
      invalidateEvents();
    }
  });

  async function onShare(event: EventCard): Promise<void> {
    setStatusMessage(null);

    try {
      const payload = sharePayload(event);

      if (navigator.share) {
        await navigator.share(payload);
        setStatusMessage("Event shared.");
        return;
      }

      await navigator.clipboard.writeText(`${payload.title} - ${payload.text} ${payload.url}`);
      setStatusMessage("Event link copied.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Share failed");
    }
  }

  const pending = eventMutation.isPending;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Button aria-label="Back to home" asChild size="icon" type="button" variant="secondary">
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Logo />
        <Button aria-label="Your event plans" asChild size="icon" type="button" variant="secondary">
          <Link href="/profile">
            <CalendarCheck2 className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="text-center">
            <p className="font-display text-4xl text-royal-ink">
              <CalendarDays className="mb-1 inline h-8 w-8 text-rose-700" /> events
            </p>
            <p className="mt-2 text-sm leading-6 text-royal-ink">
              book clubs, food trails, films, workshops and low-pressure group plans
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px]">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-rose-100 bg-white/75 px-4 text-sm text-zinc-600 shadow-glass">
              <Search className="h-5 w-5 text-rose-700" />
              <input
                className="min-w-0 flex-1 bg-transparent text-royal-ink outline-none placeholder:text-zinc-500"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="search events"
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
            <button
              className={
                category === ""
                  ? "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                  : "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
              }
              onClick={() => setCategory("")}
              type="button"
            >
              <Sparkles className="h-4 w-4" />
              all
            </button>
            {categoryOptions.map((item) => (
              <button
                className={
                  category === item.value
                    ? "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                    : "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
                }
                key={item.value}
                onClick={() => setCategory((value) => (value === item.value ? "" : item.value))}
                type="button"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {statusMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm font-medium text-royal-ink shadow-glass">
              {statusMessage}
            </div>
          ) : null}

          {eventsQuery.isLoading ? (
            <FloralFrame className="mt-5 p-4">
              <div className="grid min-h-[360px] place-items-center rounded-[1.5rem] border border-rose-100 bg-white/80 text-royal-ink">
                <Loader2 className="h-8 w-8 animate-spin text-rose-700" />
              </div>
            </FloralFrame>
          ) : selectedEvent ? (
            <FeaturedEvent
              event={selectedEvent}
              joined={myEventIds.has(selectedEvent.id)}
              onAction={(type) => eventMutation.mutate({ event: selectedEvent, type })}
              onShare={() => void onShare(selectedEvent)}
              pending={pending}
            />
          ) : (
            <FloralFrame className="mt-5 p-4">
              <div className="grid min-h-[260px] place-items-center rounded-[1.4rem] border border-rose-100 bg-white/80 text-center">
                <div>
                  <CalendarDays className="mx-auto h-10 w-10 text-rose-700" />
                  <p className="mt-3 font-display text-2xl text-royal-ink">No events found</p>
                </div>
              </div>
            </FloralFrame>
          )}

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-royal-ink">local plans</h2>
              <span className="text-xs font-semibold text-rose-700">{events.length} found</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {events.map((event) => (
                <button
                  className={
                    selectedEvent?.id === event.id
                      ? "grid grid-cols-[82px_1fr] gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-2 text-left shadow-glass"
                      : "grid grid-cols-[82px_1fr] gap-3 rounded-2xl border border-rose-100 bg-white/75 p-2 text-left shadow-glass"
                  }
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  type="button"
                >
                  <img
                    alt={event.title}
                    className="h-20 w-full rounded-xl object-cover"
                    src={eventImage(event)}
                  />
                  <span className="min-w-0 py-1">
                    <span className="block truncate font-display text-xl text-royal-ink">
                      {event.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-zinc-600">
                      {formatDate(event.startsAt)}
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-rose-700">
                      {formatCategory(event.category)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <FloralFrame className="p-4">
            <div className="rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <h2 className="text-center font-display text-2xl text-royal-ink">your plans</h2>
              <div className="mt-4 grid gap-3">
                {(myEventsQuery.data?.events ?? []).slice(0, 4).map((event) => (
                  <button
                    className="rounded-2xl border border-rose-100 bg-cream-50 p-3 text-left"
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    type="button"
                  >
                    <span className="block font-semibold text-royal-ink">{event.title}</span>
                    <span className="text-xs text-zinc-600">{formatDate(event.startsAt)}</span>
                  </button>
                ))}
                {(myEventsQuery.data?.events ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-rose-100 bg-cream-50 p-3 text-sm text-zinc-600">
                    No saved events yet.
                  </div>
                ) : null}
              </div>
            </div>
          </FloralFrame>

          <FloralFrame className="p-4">
            <div className="rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <h2 className="text-center font-display text-2xl text-royal-ink">event mix</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryOptions.slice(0, 6).map((item) => (
                  <button
                    className="grid min-h-20 place-items-center rounded-2xl border border-rose-100 bg-cream-50 px-2 text-center text-xs font-semibold text-royal-ink"
                    key={item.value}
                    onClick={() => setCategory(item.value)}
                    type="button"
                  >
                    <item.icon className="h-5 w-5 text-rose-700" />
                    {item.label}
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

function FeaturedEvent({
  event,
  joined,
  onAction,
  onShare,
  pending
}: {
  event: EventCard;
  joined: boolean;
  onAction: (type: "cancel" | "interested" | "invite" | "join") => void;
  onShare: () => void;
  pending: boolean;
}): React.JSX.Element {
  const participantPhoto = primaryParticipantPhoto(event);

  return (
    <FloralFrame className="mt-5 p-3">
      <article className="overflow-hidden rounded-[1.6rem] border border-rose-100 bg-white/80 shadow-glass">
        <div className="relative min-h-[340px]">
          <img
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover"
            src={eventImage(event)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-royal-night/90 via-royal-night/30 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-700 backdrop-blur">
              {formatCategory(event.category)}
            </span>
            {event.currentUserParticipation ? (
              <span className="rounded-full bg-rose-700/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {event.currentUserParticipation.status.toLowerCase()}
              </span>
            ) : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-sm font-semibold">{formatRange(event)}</p>
            <h1 className="mt-1 font-display text-4xl">{event.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">{event.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.venue}, {event.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {event.attendeeCount} going/interested
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {event.participantPreview.slice(0, 4).map((participant) => {
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
              {event.attendeeCount > 4 ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  +{event.attendeeCount - 4}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-2xl border border-rose-100 bg-cream-50 p-3">
            <div className="flex items-center gap-3">
              {participantPhoto ? (
                <img
                  alt="Participant"
                  className="h-12 w-12 rounded-2xl object-cover"
                  src={participantPhoto.url}
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-rose-700">
                  <CalendarDays className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-royal-ink">
                  {joined ? "Saved in your plans" : "Meet through a group-first plan"}
                </p>
                <p className="text-xs text-zinc-600">
                  {event.statusCounts.JOINED ?? 0} joined - {event.statusCounts.INTERESTED ?? 0}{" "}
                  interested
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button disabled={pending} onClick={() => onAction("join")} type="button">
              <CalendarCheck2 className="h-4 w-4" />
              Join
            </Button>
            <Button
              disabled={pending}
              onClick={() => onAction("interested")}
              type="button"
              variant="secondary"
            >
              <HandHeart className="h-4 w-4" />
              Interested
            </Button>
            <Button onClick={onShare} type="button" variant="secondary">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              disabled={pending}
              onClick={() => onAction("invite")}
              type="button"
              variant="royal"
            >
              <Send className="h-4 w-4" />
              Invite
            </Button>
            <Button
              className="col-span-2"
              disabled={pending || !joined}
              onClick={() => onAction("cancel")}
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
              Leave event
            </Button>
          </div>
        </div>
      </article>
    </FloralFrame>
  );
}
