"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Car,
  Check,
  Coffee,
  Footprints,
  MapPin,
  Palette,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import {
  acceptInstantDate,
  cancelInstantDate,
  completeInstantDate,
  createInstantDate,
  listInstantDates,
  rejectInstantDate,
  rescheduleInstantDate,
  shareInstantDateLocation,
  type InstantDateActivity,
  type InstantDateCard,
  type InstantDateTimeWindow
} from "@/lib/instant-date-client";
import { getProfile } from "@/lib/profile-client";

const activities: Array<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: InstantDateActivity;
}> = [
  { icon: Coffee, label: "coffee & chill", value: "COFFEE" },
  { icon: Utensils, label: "dinner & talks", value: "DINNER" },
  { icon: Footprints, label: "walks & talks", value: "WALK" },
  { icon: Car, label: "drive & vibe", value: "DRIVE" },
  { icon: Palette, label: "art & culture", value: "ART" },
  { icon: ShoppingBag, label: "market runs", value: "MARKET" },
  { icon: Sparkles, label: "anything casual", value: "CASUAL" }
];

const timeWindows: Array<{ label: string; value: InstantDateTimeWindow }> = [
  { label: "now", value: "now" },
  { label: "tonight", value: "tonight" },
  { label: "this weekend", value: "this_weekend" },
  { label: "custom", value: "custom" }
];

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  }).format(new Date(value));
}

function primaryPhoto(instantDate: InstantDateCard) {
  return (
    instantDate.participant?.photos.find((photo) => photo.isPrimary) ??
    instantDate.participant?.photos[0]
  );
}

export function InstantDateScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activity, setActivity] = useState<InstantDateActivity>("COFFEE");
  const [timeWindow, setTimeWindow] = useState<InstantDateTimeWindow>("now");
  const [customDate, setCustomDate] = useState("");
  const [venue, setVenue] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const instantDatesQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: () => listInstantDates("active"),
    queryKey: ["instant-dates", "active"]
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

  const activeInstantDates = instantDatesQuery.data?.instantDates ?? [];
  const incoming = useMemo(
    () => activeInstantDates.filter((instantDate) => instantDate.direction === "incoming"),
    [activeInstantDates]
  );
  const outgoing = useMemo(
    () => activeInstantDates.filter((instantDate) => instantDate.direction !== "incoming"),
    [activeInstantDates]
  );

  const invalidateInstantDates = () => {
    void queryClient.invalidateQueries({
      queryKey: ["instant-dates"]
    });
  };

  const createMutation = useMutation({
    mutationFn: createInstantDate,
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: (result) => {
      const participant = result.instantDate.participant?.name;

      setStatusMessage(
        participant
          ? `Request sent to ${participant}.`
          : "Your request is live. We will keep looking nearby."
      );
      invalidateInstantDates();
    }
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      type
    }: {
      id: string;
      type: "accept" | "cancel" | "complete" | "reject" | "reschedule" | "location";
    }) => {
      if (type === "accept") {
        return acceptInstantDate(id);
      }

      if (type === "reject") {
        return rejectInstantDate(id);
      }

      if (type === "cancel") {
        return cancelInstantDate(id);
      }

      if (type === "complete") {
        return completeInstantDate(id);
      }

      if (type === "location") {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Location sharing is not available in this browser."));
            return;
          }

          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000
          });
        });

        return shareInstantDateLocation(id, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      }

      return rescheduleInstantDate(id, {
        proposedAt:
          timeWindow === "custom" && customDate ? new Date(customDate).toISOString() : undefined,
        timeWindow,
        venue: venue.trim() || undefined
      });
    },
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: (result, variables) => {
      setStatusMessage(
        variables.type === "accept"
          ? "Instant Date accepted. Chat is ready."
          : variables.type === "location"
            ? "Live location shared for this plan."
            : "Instant Date updated."
      );
      invalidateInstantDates();
    }
  });

  function submitInstantDate(): void {
    if (timeWindow === "custom" && !customDate) {
      setStatusMessage("Pick a custom date and time.");
      return;
    }

    createMutation.mutate({
      activity,
      latitude: profileQuery.data?.latitude ? Number(profileQuery.data.latitude) : undefined,
      longitude: profileQuery.data?.longitude ? Number(profileQuery.data.longitude) : undefined,
      proposedAt: timeWindow === "custom" ? new Date(customDate).toISOString() : undefined,
      timeWindow,
      venue: venue.trim() || undefined
    });
  }

  const pending = createMutation.isPending || actionMutation.isPending;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-[520px] items-center justify-between px-5 py-5">
        <Button aria-label="Back to home" asChild size="icon" type="button" variant="secondary">
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Logo />
        <Button aria-label="Instant Date safety" size="icon" type="button" variant="secondary">
          <ShieldCheck className="h-5 w-5" />
        </Button>
      </header>

      <section className="mx-auto max-w-[520px] px-5">
        <div className="text-center">
          <p className="font-display text-5xl text-rose-700">instant date</p>
          <p className="mt-2 text-sm leading-6 text-royal-ink">
            spontaneous plans, serendipitous connections
          </p>
        </div>

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm font-medium text-royal-ink shadow-glass">
            {statusMessage}
          </div>
        ) : null}

        <FloralFrame className="mt-5 p-4">
          <div className="rounded-[1.4rem] border border-rose-100 bg-white/78 p-4">
            <h1 className="font-display text-2xl text-royal-ink">how it works</h1>
            <div className="mt-4 grid gap-3 text-sm text-royal-ink">
              {[
                ["1", "tell us what you're up for"],
                ["2", "we'll find someone nearby"],
                ["3", "chat briefly and confirm"],
                ["4", "meet safely, or cancel anytime"]
              ].map(([step, copy]) => (
                <div className="flex items-center gap-3" key={step}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-50 font-display text-rose-700">
                    {step}
                  </span>
                  <span>{copy}</span>
                </div>
              ))}
            </div>
          </div>
        </FloralFrame>

        <section className="mt-5">
          <h2 className="text-center font-display text-2xl text-royal-ink">choose your vibe</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activities.map((item) => (
              <button
                className={
                  activity === item.value
                    ? "grid min-h-24 place-items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700 shadow-glass"
                    : "grid min-h-24 place-items-center gap-2 rounded-2xl border border-rose-100 bg-white/70 p-3 text-center text-xs font-semibold text-royal-ink shadow-glass"
                }
                key={item.value}
                onClick={() => setActivity(item.value)}
                type="button"
              >
                <item.icon className="h-6 w-6" />
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-center font-display text-2xl text-royal-ink">pick a time</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {timeWindows.map((item) => (
              <button
                className={
                  timeWindow === item.value
                    ? "h-10 rounded-2xl border border-rose-300 bg-rose-50 text-xs font-semibold text-rose-700"
                    : "h-10 rounded-2xl border border-rose-100 bg-white/70 text-xs font-semibold text-royal-ink"
                }
                key={item.value}
                onClick={() => setTimeWindow(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-3">
            {timeWindow === "custom" ? (
              <input
                className="h-11 rounded-2xl border border-rose-100 bg-white/80 px-4 text-sm text-royal-ink outline-none"
                onChange={(event) => setCustomDate(event.target.value)}
                type="datetime-local"
                value={customDate}
              />
            ) : null}
            <input
              className="h-11 rounded-2xl border border-rose-100 bg-white/80 px-4 text-sm text-royal-ink outline-none placeholder:text-zinc-500"
              onChange={(event) => setVenue(event.target.value)}
              placeholder="optional venue"
              value={venue}
            />
          </div>

          <Button
            className="mt-4 w-full"
            disabled={pending}
            onClick={submitInstantDate}
            type="button"
          >
            <Send className="h-4 w-4" />
            {createMutation.isPending ? "finding..." : "find my date"}
          </Button>
        </section>

        <InstantDateList
          actionPending={pending}
          instantDates={incoming}
          onAction={(id, type) => actionMutation.mutate({ id, type })}
          title="requests for you"
        />
        <InstantDateList
          actionPending={pending}
          instantDates={outgoing}
          onAction={(id, type) => actionMutation.mutate({ id, type })}
          title="your plans"
        />
      </section>

      <AppBottomNav />
    </main>
  );
}

function InstantDateList({
  actionPending,
  instantDates,
  onAction,
  title
}: {
  actionPending: boolean;
  instantDates: InstantDateCard[];
  onAction: (
    id: string,
    type: "accept" | "cancel" | "complete" | "reject" | "reschedule" | "location"
  ) => void;
  title: string;
}): React.JSX.Element | null {
  if (instantDates.length === 0) {
    return null;
  }

  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl text-royal-ink">{title}</h2>
      <div className="mt-3 grid gap-3">
        {instantDates.map((instantDate) => {
          const photo = primaryPhoto(instantDate);

          return (
            <FloralFrame className="p-2" key={instantDate.id}>
              <article className="rounded-[1.3rem] border border-rose-100 bg-white/80 p-3">
                <div className="grid grid-cols-[72px_1fr] gap-3">
                  <div className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
                    {photo ? (
                      <img
                        alt={instantDate.participant?.name ?? "Instant Date"}
                        className="h-20 w-full object-cover"
                        src={photo.url}
                      />
                    ) : (
                      <div className="grid h-20 place-items-center text-rose-700">
                        <CalendarClock className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-2xl text-royal-ink">
                          {instantDate.participant?.name ?? "Finding nearby"}
                        </h3>
                        <p className="truncate text-xs text-zinc-600">
                          {[instantDate.participant?.profession, instantDate.participant?.city]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      </div>
                      <Badge>{formatEnum(instantDate.status)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-white">{formatEnum(instantDate.activity)}</Badge>
                      <Badge className="bg-white">{formatDate(instantDate.proposedAt)}</Badge>
                      {instantDate.participant ? (
                        <Badge className="bg-white">
                          {instantDate.participant.compatibilityScore}% vibe
                        </Badge>
                      ) : null}
                    </div>
                    {instantDate.venue ? (
                      <p className="mt-3 flex items-center gap-1 text-sm text-royal-ink">
                        <MapPin className="h-4 w-4 text-rose-700" />
                        {instantDate.venue}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {instantDate.canAccept ? (
                    <Button
                      disabled={actionPending}
                      onClick={() => onAction(instantDate.id, "accept")}
                      size="sm"
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                      accept
                    </Button>
                  ) : null}
                  {instantDate.canReject ? (
                    <Button
                      disabled={actionPending}
                      onClick={() => onAction(instantDate.id, "reject")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <X className="h-4 w-4" />
                      reject
                    </Button>
                  ) : null}
                  {instantDate.canReschedule ? (
                    <Button
                      disabled={actionPending}
                      onClick={() => onAction(instantDate.id, "reschedule")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      reschedule
                    </Button>
                  ) : null}
                  {instantDate.status === "ACCEPTED" ? (
                    <>
                      {instantDate.chatMatchId ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/chats/${instantDate.chatMatchId}`}>chat</Link>
                        </Button>
                      ) : null}
                      <Button
                        disabled={actionPending}
                        onClick={() => onAction(instantDate.id, "location")}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        share location
                      </Button>
                      <Button
                        disabled={actionPending}
                        onClick={() => onAction(instantDate.id, "complete")}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        complete
                      </Button>
                    </>
                  ) : null}
                  {instantDate.canCancel ? (
                    <Button
                      disabled={actionPending}
                      onClick={() => onAction(instantDate.id, "cancel")}
                      size="sm"
                      type="button"
                      variant="royal"
                    >
                      cancel
                    </Button>
                  ) : null}
                </div>
              </article>
            </FloralFrame>
          );
        })}
      </div>
    </section>
  );
}
