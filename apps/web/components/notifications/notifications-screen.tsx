"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CalendarHeart,
  CheckCheck,
  Eye,
  Heart,
  HeartHandshake,
  Loader2,
  Mail,
  MessageCircle,
  Music2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import {
  deleteNotification,
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type NotificationChannel,
  type NotificationItem,
  type NotificationType
} from "@/lib/notification-client";
import { getProfile } from "@/lib/profile-client";

const notificationTypes: Array<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: NotificationType;
}> = [
  {
    icon: Heart,
    label: "likes",
    value: "LIKE"
  },
  {
    icon: HeartHandshake,
    label: "matches",
    value: "MATCH"
  },
  {
    icon: MessageCircle,
    label: "messages",
    value: "MESSAGE"
  },
  {
    icon: Music2,
    label: "concerts",
    value: "CONCERT_INVITATION"
  },
  {
    icon: CalendarHeart,
    label: "dates",
    value: "INSTANT_DATE_REQUEST"
  },
  {
    icon: Eye,
    label: "views",
    value: "PROFILE_VIEW"
  },
  {
    icon: ShieldCheck,
    label: "verification",
    value: "VERIFICATION"
  },
  {
    icon: Sparkles,
    label: "system",
    value: "SYSTEM"
  }
];

const channels: Array<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: NotificationChannel;
}> = [
  {
    icon: Bell,
    label: "in-app",
    value: "IN_APP"
  },
  {
    icon: Wifi,
    label: "push",
    value: "PUSH"
  },
  {
    icon: Mail,
    label: "email",
    value: "EMAIL"
  }
];

function formatTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "just now";
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)}m ago`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(date);
}

function labelForType(type: NotificationType): string {
  return notificationTypes.find((item) => item.value === type)?.label ?? type.toLowerCase();
}

function iconForType(type: NotificationType) {
  return notificationTypes.find((item) => item.value === type)?.icon ?? Bell;
}

function dataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function actionHref(notification: NotificationItem): string {
  const data = dataRecord(notification.data);
  const matchId = stringField(data.matchId);

  if (notification.type === "MESSAGE" && matchId) {
    return `/chats/${matchId}`;
  }

  if (notification.type === "MATCH") {
    return matchId ? `/chats/${matchId}` : "/matches";
  }

  if (notification.type === "LIKE") {
    return "/matches";
  }

  if (notification.type === "CONCERT_INVITATION") {
    return "/concert-mode";
  }

  if (notification.type === "INSTANT_DATE_REQUEST") {
    return "/instant-date";
  }

  if (notification.type === "PROFILE_VIEW" || notification.type === "VERIFICATION") {
    return "/profile";
  }

  const eventId = stringField(data.eventId);

  return eventId ? "/events" : "/home";
}

export function NotificationsScreen(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [type, setType] = useState<NotificationType | "">("");
  const [channel, setChannel] = useState<NotificationChannel | "">("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const notificationsQuery = useQuery({
    enabled: !profileQuery.isError,
    queryFn: () =>
      listNotifications({
        channel: channel || undefined,
        limit: 30,
        type: type || undefined,
        unread: unreadOnly || undefined
      }),
    queryKey: ["notifications", "list", unreadOnly, type, channel]
  });
  const preferencesQuery = useQuery({
    enabled: !profileQuery.isError,
    queryFn: getNotificationPreferences,
    queryKey: ["notifications", "preferences"]
  });

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace("/login");
    }
  }, [profileQuery.isError, router]);

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const grouped = useMemo(
    () => ({
      read: notifications.filter((notification) => notification.readAt),
      unread: notifications.filter((notification) => !notification.readAt)
    }),
    [notifications]
  );

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({
      queryKey: ["notifications"]
    });
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: () => {
      setStatusMessage("Notification marked read.");
      invalidateNotifications();
    }
  });
  const markAllMutation = useMutation({
    mutationFn: () =>
      markAllNotificationsRead({
        channel: channel || undefined,
        type: type || undefined
      }),
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: (result) => {
      setStatusMessage(
        `${result.updatedCount} notification${result.updatedCount === 1 ? "" : "s"} marked read.`
      );
      invalidateNotifications();
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: () => {
      setStatusMessage("Notification removed.");
      invalidateNotifications();
    }
  });
  const preferencesMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onError: (error: Error) => setStatusMessage(error.message),
    onMutate: () => setStatusMessage(null),
    onSuccess: () => {
      setStatusMessage("Notification preferences updated.");
      invalidateNotifications();
    }
  });

  const pending =
    markReadMutation.isPending ||
    markAllMutation.isPending ||
    deleteMutation.isPending ||
    preferencesMutation.isPending;
  const preferences = preferencesMutation.data?.preferences ?? preferencesQuery.data?.preferences;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Button aria-label="Back to home" asChild size="icon" type="button" variant="secondary">
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Logo />
        <Button
          aria-label="Mark all read"
          disabled={pending || unreadCount === 0}
          onClick={() => markAllMutation.mutate()}
          size="icon"
          type="button"
          variant="secondary"
        >
          <CheckCheck className="h-5 w-5" />
        </Button>
      </header>

      <section className="mx-auto grid max-w-5xl gap-5 px-5 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="text-center">
            <p className="font-display text-4xl text-royal-ink">
              <BellRing className="mb-1 inline h-8 w-8 text-rose-700" /> notifications
            </p>
            <p className="mt-2 text-sm leading-6 text-royal-ink">
              {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              className={
                !unreadOnly
                  ? "h-10 shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                  : "h-10 shrink-0 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
              }
              onClick={() => setUnreadOnly(false)}
              type="button"
            >
              all
            </button>
            <button
              className={
                unreadOnly
                  ? "h-10 shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                  : "h-10 shrink-0 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
              }
              onClick={() => setUnreadOnly(true)}
              type="button"
            >
              unread
            </button>
            {notificationTypes.map((item) => (
              <button
                className={
                  type === item.value
                    ? "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                    : "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
                }
                key={item.value}
                onClick={() => setType((value) => (value === item.value ? "" : item.value))}
                type="button"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {channels.map((item) => (
              <button
                className={
                  channel === item.value
                    ? "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                    : "flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
                }
                key={item.value}
                onClick={() => setChannel((value) => (value === item.value ? "" : item.value))}
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

          <FloralFrame className="mt-5 p-3">
            <div className="min-h-[460px] rounded-[1.6rem] border border-rose-100 bg-white/80 p-3 shadow-glass">
              {notificationsQuery.isLoading ? (
                <div className="grid min-h-[420px] place-items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-rose-700" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="grid gap-3">
                  {grouped.unread.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onDelete={() => deleteMutation.mutate(notification.id)}
                      onRead={() => markReadMutation.mutate(notification.id)}
                      pending={pending}
                    />
                  ))}
                  {grouped.unread.length > 0 && grouped.read.length > 0 ? (
                    <div className="px-2 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      read
                    </div>
                  ) : null}
                  {grouped.read.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onDelete={() => deleteMutation.mutate(notification.id)}
                      onRead={() => markReadMutation.mutate(notification.id)}
                      pending={pending}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid min-h-[420px] place-items-center text-center">
                  <div>
                    <Bell className="mx-auto h-10 w-10 text-rose-700" />
                    <p className="mt-3 font-display text-2xl text-royal-ink">Nothing here yet</p>
                  </div>
                </div>
              )}
            </div>
          </FloralFrame>
        </div>

        <aside className="space-y-4">
          <FloralFrame className="p-4">
            <div className="rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <h2 className="text-center font-display text-2xl text-royal-ink">delivery</h2>
              <div className="mt-4 grid gap-3">
                <PreferenceToggle
                  checked={preferences?.pushNotifications ?? true}
                  icon={Wifi}
                  label="push"
                  onChange={(checked) =>
                    preferencesMutation.mutate({
                      pushNotifications: checked
                    })
                  }
                  pending={preferencesMutation.isPending}
                />
                <PreferenceToggle
                  checked={preferences?.emailNotifications ?? true}
                  icon={Mail}
                  label="email"
                  onChange={(checked) =>
                    preferencesMutation.mutate({
                      emailNotifications: checked
                    })
                  }
                  pending={preferencesMutation.isPending}
                />
              </div>
            </div>
          </FloralFrame>

          <FloralFrame className="p-4">
            <div className="rounded-[1.4rem] border border-rose-100 bg-white/80 p-4">
              <h2 className="text-center font-display text-2xl text-royal-ink">summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {notificationTypes.slice(0, 6).map((item) => {
                  const count = notifications.filter(
                    (notification) => notification.type === item.value
                  ).length;

                  return (
                    <button
                      className="grid min-h-20 place-items-center rounded-2xl border border-rose-100 bg-cream-50 px-2 text-center text-xs font-semibold text-royal-ink"
                      key={item.value}
                      onClick={() => setType(item.value)}
                      type="button"
                    >
                      <item.icon className="h-5 w-5 text-rose-700" />
                      <span>{item.label}</span>
                      <span className="text-rose-700">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </FloralFrame>
        </aside>
      </section>

      <AppBottomNav />
    </main>
  );
}

function NotificationRow({
  notification,
  onDelete,
  onRead,
  pending
}: {
  notification: NotificationItem;
  onDelete: () => void;
  onRead: () => void;
  pending: boolean;
}): React.JSX.Element {
  const Icon = iconForType(notification.type);
  const unread = !notification.readAt;

  return (
    <article
      className={
        unread
          ? "grid gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 shadow-glass sm:grid-cols-[1fr_auto]"
          : "grid gap-3 rounded-2xl border border-rose-100 bg-white/75 p-3 sm:grid-cols-[1fr_auto]"
      }
    >
      <Link className="flex min-w-0 gap-3" href={actionHref(notification)}>
        <span
          className={
            unread
              ? "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-gold text-white"
              : "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream-50 text-rose-700"
          }
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-royal-ink">{notification.title}</span>
            <Badge>{labelForType(notification.type)}</Badge>
          </span>
          <span className="mt-1 block text-sm leading-6 text-zinc-600">{notification.body}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500">
            <span>{formatTime(notification.createdAt)}</span>
            <span>{notification.channel.toLowerCase().replace("_", "-")}</span>
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2 sm:justify-end">
        <Button
          aria-label="Mark notification read"
          disabled={pending || !unread}
          onClick={onRead}
          size="icon"
          type="button"
          variant="secondary"
        >
          <CheckCheck className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Delete notification"
          disabled={pending}
          onClick={onDelete}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function PreferenceToggle({
  checked,
  icon: Icon,
  label,
  onChange,
  pending
}: {
  checked: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onChange: (checked: boolean) => void;
  pending: boolean;
}): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-cream-50 p-3">
      <span className="flex items-center gap-3 text-sm font-semibold text-royal-ink">
        <Icon className="h-5 w-5 text-rose-700" />
        {label}
      </span>
      <input
        checked={checked}
        className="h-5 w-5 rounded border-rose-200"
        disabled={pending}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
