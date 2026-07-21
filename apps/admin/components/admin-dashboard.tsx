"use client";

import type { ComponentType, FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LogOut,
  Megaphone,
  Music2,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users
} from "lucide-react";
import { Badge, Button, Card, Input, Logo, Textarea } from "@matcha/ui";

import {
  banAdminUser,
  broadcastAdminNotification,
  deleteAdminUser,
  getAdminDashboard,
  getAdminMe,
  listAdminAuditLogs,
  listAdminConcerts,
  listAdminEvents,
  listAdminReports,
  listAdminUsers,
  listAdminVerifications,
  loginAdmin,
  logoutAdmin,
  reviewAdminReport,
  reviewAdminVerification,
  unbanAdminUser,
  updateAdminConcertPublish,
  updateAdminEventPublish,
  type AdminAuditLog,
  type AdminConcert,
  type AdminEvent,
  type AdminMetrics,
  type AdminNotificationChannel,
  type AdminNotificationType,
  type AdminReport,
  type AdminReportStatus,
  type AdminUser,
  type AdminVerification
} from "@/lib/admin-client";

type AdminTab = "audit" | "broadcast" | "events" | "overview" | "reports" | "users" | "verify";

const tabs: Array<{ label: string; value: AdminTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Users", value: "users" },
  { label: "Reports", value: "reports" },
  { label: "Verification", value: "verify" },
  { label: "Events", value: "events" },
  { label: "Broadcast", value: "broadcast" },
  { label: "Audit", value: "audit" }
];

const metricCards: Array<{
  icon: ComponentType<{ className?: string }>;
  key: keyof AdminMetrics;
  label: string;
}> = [
  { icon: Users, key: "activeUsers", label: "Active users" },
  { icon: CircleAlert, key: "pendingReports", label: "Reports pending" },
  { icon: UserCheck, key: "verificationQueue", label: "Verification queue" },
  { icon: CalendarDays, key: "publishedEvents", label: "Events live" },
  { icon: Music2, key: "publishedConcerts", label: "Concerts live" },
  { icon: ShieldCheck, key: "totalMatches", label: "Matches created" },
  { icon: Bell, key: "totalMessages", label: "Messages sent" },
  { icon: ClipboardCheck, key: "instantDateRequests", label: "Instant dates" }
];

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function invalidateAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: ["admin"]
  });
}

export function AdminDashboard(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const meQuery = useQuery({
    queryFn: getAdminMe,
    queryKey: ["admin", "me"],
    retry: false
  });
  const isAdmin = Boolean(meQuery.data?.admin);
  const dashboardQuery = useQuery({
    enabled: isAdmin,
    queryFn: getAdminDashboard,
    queryKey: ["admin", "dashboard"]
  });
  const usersQuery = useQuery({
    enabled: isAdmin,
    queryFn: () => listAdminUsers({ limit: 12, q: search || undefined }),
    queryKey: ["admin", "users", search]
  });
  const reportsQuery = useQuery({
    enabled: isAdmin,
    queryFn: () => listAdminReports({ limit: 12 }),
    queryKey: ["admin", "reports"]
  });
  const verificationsQuery = useQuery({
    enabled: isAdmin,
    queryFn: () => listAdminVerifications({ limit: 12, status: "MANUAL_REVIEW" }),
    queryKey: ["admin", "verifications"]
  });
  const eventsQuery = useQuery({
    enabled: isAdmin,
    queryFn: () => listAdminEvents({ limit: 12 }),
    queryKey: ["admin", "events"]
  });
  const concertsQuery = useQuery({
    enabled: isAdmin,
    queryFn: () => listAdminConcerts({ limit: 12 }),
    queryKey: ["admin", "concerts"]
  });
  const auditQuery = useQuery({
    enabled: isAdmin,
    queryFn: () => listAdminAuditLogs({ limit: 14 }),
    queryKey: ["admin", "audit"]
  });
  const logoutMutation = useMutation({
    mutationFn: logoutAdmin,
    onSettled: () => {
      void queryClient.clear();
      window.location.reload();
    }
  });

  if (meQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="rounded-2xl border border-rose-100 bg-white/75 px-5 py-4 text-sm font-semibold text-royal-ink shadow-glass">
          Loading admin console
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return <AdminLogin onStatus={setStatusMessage} />;
  }

  const metrics = dashboardQuery.data?.metrics;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          <Badge>{meQuery.data?.admin.email}</Badge>
          <Button
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            size="sm"
            type="button"
            variant="secondary"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <section className="mx-auto mt-6 max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Safety operations center</Badge>
            <h1 className="mt-3 font-display text-4xl leading-tight text-royal-ink sm:text-5xl">
              MatchA admin dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              Users, moderation, verification, events, broadcasts, and audit history in one place.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex h-11 min-w-72 items-center gap-2 rounded-xl border border-rose-100 bg-white/75 px-3 text-sm shadow-glass">
              <Search className="h-4 w-4 text-rose-700" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users"
                value={search}
              />
            </label>
            <Button onClick={() => setActiveTab("broadcast")} type="button">
              <Megaphone className="h-4 w-4" />
              Broadcast
            </Button>
          </div>
        </div>

        {statusMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm font-medium text-royal-ink shadow-glass">
            {statusMessage}
          </div>
        ) : null}
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard
            icon={metric.icon}
            key={metric.key}
            label={metric.label}
            value={metrics?.[metric.key] ?? 0}
          />
        ))}
      </section>

      <nav className="mx-auto mt-6 flex max-w-7xl gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            className={
              activeTab === tab.value
                ? "h-10 shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-semibold text-rose-700"
                : "h-10 shrink-0 rounded-xl border border-rose-100 bg-white/70 px-4 text-xs font-semibold text-royal-ink"
            }
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="mx-auto mt-5 max-w-7xl">
        {activeTab === "overview" ? (
          <OverviewPanel
            auditLogs={dashboardQuery.data?.recentAuditLogs ?? []}
            metrics={metrics}
            reports={reportsQuery.data?.reports ?? []}
            verifications={verificationsQuery.data?.verifications ?? []}
          />
        ) : null}
        {activeTab === "users" ? (
          <UsersPanel
            onStatus={setStatusMessage}
            queryClient={queryClient}
            users={usersQuery.data?.users ?? []}
          />
        ) : null}
        {activeTab === "reports" ? (
          <ReportsPanel
            onStatus={setStatusMessage}
            queryClient={queryClient}
            reports={reportsQuery.data?.reports ?? []}
          />
        ) : null}
        {activeTab === "verify" ? (
          <VerificationPanel
            onStatus={setStatusMessage}
            queryClient={queryClient}
            verifications={verificationsQuery.data?.verifications ?? []}
          />
        ) : null}
        {activeTab === "events" ? (
          <EventsPanel
            concerts={concertsQuery.data?.concerts ?? []}
            events={eventsQuery.data?.events ?? []}
            onStatus={setStatusMessage}
            queryClient={queryClient}
          />
        ) : null}
        {activeTab === "broadcast" ? (
          <BroadcastPanel onStatus={setStatusMessage} queryClient={queryClient} />
        ) : null}
        {activeTab === "audit" ? <AuditPanel logs={auditQuery.data?.auditLogs ?? []} /> : null}
      </section>
    </main>
  );
}

function AdminLogin({
  onStatus
}: {
  onStatus: (message: string | null) => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("admin@matcha.local");
  const [password, setPassword] = useState("Admin@2026");
  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onError: (error: Error) => onStatus(error.message),
    onMutate: () => onStatus(null),
    onSuccess: async (result) => {
      if (result.user.role !== "ADMIN") {
        onStatus("This account is not allowed to access admin.");
        await logoutAdmin();
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["admin"]
      });
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({
      email,
      password,
      rememberMe: true
    });
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md p-6">
        <Logo />
        <Badge className="mt-6">Admin access</Badge>
        <h1 className="mt-3 font-display text-4xl text-royal-ink">Login to operations</h1>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-royal-ink">
            Email
            <Input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-royal-ink">
            Password
            <Input
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <Button disabled={loginMutation.isPending} type="submit">
            <ShieldCheck className="h-4 w-4" />
            {loginMutation.isPending ? "Checking..." : "Login"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}): React.JSX.Element {
  return (
    <Card className="p-5">
      <Icon className="h-6 w-6 text-rose-700" />
      <p className="mt-4 font-display text-4xl text-royal-ink">{value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-sm text-zinc-600">{label}</p>
    </Card>
  );
}

function OverviewPanel({
  auditLogs,
  metrics,
  reports,
  verifications
}: {
  auditLogs: AdminAuditLog[];
  metrics?: AdminMetrics;
  reports: AdminReport[];
  verifications: AdminVerification[];
}): React.JSX.Element {
  const queues = [
    {
      count: metrics?.verificationQueue ?? 0,
      label: "Manual verification",
      priority: "High"
    },
    {
      count: metrics?.pendingReports ?? 0,
      label: "Abuse reports",
      priority: "Critical"
    },
    {
      count: reports.filter((report) => report.status === "OPEN").length,
      label: "Open reports in view",
      priority: "High"
    },
    {
      count: verifications.filter((verification) => verification.status === "MANUAL_REVIEW").length,
      label: "Verification cards loaded",
      priority: "Medium"
    }
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-royal-ink">Review queues</h2>
          <ShieldCheck className="h-7 w-7 text-rose-700" />
        </div>
        <div className="mt-5 grid gap-3">
          {queues.map((queue) => (
            <div
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-rose-100 bg-white/70 p-4"
              key={queue.label}
            >
              <div>
                <p className="font-semibold text-royal-ink">{queue.label}</p>
                <p className="text-xs text-zinc-500">SLA tracked through audit history</p>
              </div>
              <Badge>{queue.priority}</Badge>
              <span className="font-display text-2xl text-rose-700">{queue.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-3xl text-royal-ink">Recent audit</h2>
        <div className="mt-5 grid gap-3">
          {auditLogs.slice(0, 6).map((log) => (
            <AuditRow key={log.id} log={log} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function UsersPanel({
  onStatus,
  queryClient,
  users
}: {
  onStatus: (message: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  users: AdminUser[];
}): React.JSX.Element {
  const userMutation = useMutation({
    mutationFn: ({ action, id }: { action: "ban" | "delete" | "unban"; id: string }) => {
      if (action === "ban") {
        return banAdminUser(id);
      }

      if (action === "unban") {
        return unbanAdminUser(id);
      }

      return deleteAdminUser(id);
    },
    onError: (error: Error) => onStatus(error.message),
    onMutate: () => onStatus(null),
    onSuccess: (_result, variables) => {
      onStatus(`User ${variables.action} action completed.`);
      invalidateAdmin(queryClient);
    }
  });

  return (
    <Card className="p-5">
      <h2 className="font-display text-3xl text-royal-ink">Users</h2>
      <div className="mt-5 grid gap-3">
        {users.map((user) => (
          <div
            className="grid gap-3 rounded-2xl border border-rose-100 bg-white/75 p-3 lg:grid-cols-[1fr_auto]"
            key={user.id}
          >
            <div className="flex min-w-0 gap-3">
              {user.primaryPhoto ? (
                <img
                  alt={user.name ?? user.email}
                  className="h-14 w-14 rounded-2xl object-cover"
                  src={user.primaryPhoto}
                />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-50 text-rose-700">
                  <Users className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-royal-ink">
                  {user.name ?? "Unnamed"} <span className="text-zinc-500">- {user.email}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {user.city ?? "No city"} - {user.profileCompletion}% profile -{" "}
                  {formatEnum(user.verificationStatus)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{user.role}</Badge>
                  {user.isBanned ? <Badge>Banned</Badge> : null}
                  {user.deletedAt ? <Badge>Deleted</Badge> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {user.isBanned ? (
                <Button
                  disabled={userMutation.isPending}
                  onClick={() => userMutation.mutate({ action: "unban", id: user.id })}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Unban
                </Button>
              ) : (
                <Button
                  disabled={userMutation.isPending || user.role === "ADMIN"}
                  onClick={() => userMutation.mutate({ action: "ban", id: user.id })}
                  size="sm"
                  type="button"
                  variant="royal"
                >
                  <Ban className="h-4 w-4" />
                  Ban
                </Button>
              )}
              <Button
                disabled={
                  userMutation.isPending || user.role === "ADMIN" || Boolean(user.deletedAt)
                }
                onClick={() => {
                  if (window.confirm(`Delete ${user.email}?`)) {
                    userMutation.mutate({ action: "delete", id: user.id });
                  }
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReportsPanel({
  onStatus,
  queryClient,
  reports
}: {
  onStatus: (message: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  reports: AdminReport[];
}): React.JSX.Element {
  const reportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminReportStatus }) =>
      reviewAdminReport(id, {
        reason: "Reviewed from admin dashboard",
        status
      }),
    onError: (error: Error) => onStatus(error.message),
    onMutate: () => onStatus(null),
    onSuccess: (_result, variables) => {
      onStatus(`Report marked ${formatEnum(variables.status)}.`);
      invalidateAdmin(queryClient);
    }
  });

  return (
    <Card className="p-5">
      <h2 className="font-display text-3xl text-royal-ink">Reports</h2>
      <div className="mt-5 grid gap-3">
        {reports.map((report) => (
          <div className="rounded-2xl border border-rose-100 bg-white/75 p-4" key={report.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-royal-ink">{report.reason}</p>
                  <Badge>{formatEnum(report.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{report.description ?? "No details"}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {report.reporter.email} reported {report.reportedUser.email} -{" "}
                  {formatDate(report.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={reportMutation.isPending}
                  onClick={() => reportMutation.mutate({ id: report.id, status: "IN_REVIEW" })}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  In review
                </Button>
                <Button
                  disabled={reportMutation.isPending}
                  onClick={() => reportMutation.mutate({ id: report.id, status: "RESOLVED" })}
                  size="sm"
                  type="button"
                >
                  Resolve
                </Button>
                <Button
                  disabled={reportMutation.isPending}
                  onClick={() => reportMutation.mutate({ id: report.id, status: "DISMISSED" })}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VerificationPanel({
  onStatus,
  queryClient,
  verifications
}: {
  onStatus: (message: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  verifications: AdminVerification[];
}): React.JSX.Element {
  const verificationMutation = useMutation({
    mutationFn: ({
      id,
      status
    }: {
      id: string;
      status: "ID_VERIFIED" | "PHOTO_VERIFIED" | "REJECTED";
    }) =>
      reviewAdminVerification(id, {
        reason: "Reviewed from admin dashboard",
        status
      }),
    onError: (error: Error) => onStatus(error.message),
    onMutate: () => onStatus(null),
    onSuccess: (_result, variables) => {
      onStatus(`Verification marked ${formatEnum(variables.status)}.`);
      invalidateAdmin(queryClient);
    }
  });

  return (
    <Card className="p-5">
      <h2 className="font-display text-3xl text-royal-ink">Verification requests</h2>
      <div className="mt-5 grid gap-3">
        {verifications.map((verification) => (
          <div
            className="grid gap-3 rounded-2xl border border-rose-100 bg-white/75 p-3 lg:grid-cols-[auto_1fr_auto]"
            key={verification.id}
          >
            {(verification.evidenceUrl ?? verification.user.primaryPhoto) ? (
              <img
                alt={verification.user.name ?? verification.user.email}
                className="h-20 w-20 rounded-2xl object-cover"
                src={verification.evidenceUrl ?? verification.user.primaryPhoto ?? ""}
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-cream-50 text-rose-700">
                <UserCheck className="h-8 w-8" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-royal-ink">{verification.user.email}</p>
                <Badge>{verification.type}</Badge>
                <Badge>{formatEnum(verification.status)}</Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Submitted {formatDate(verification.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                disabled={verificationMutation.isPending}
                onClick={() =>
                  verificationMutation.mutate({ id: verification.id, status: "PHOTO_VERIFIED" })
                }
                size="sm"
                type="button"
              >
                Photo
              </Button>
              <Button
                disabled={verificationMutation.isPending}
                onClick={() =>
                  verificationMutation.mutate({ id: verification.id, status: "ID_VERIFIED" })
                }
                size="sm"
                type="button"
                variant="secondary"
              >
                ID
              </Button>
              <Button
                disabled={verificationMutation.isPending}
                onClick={() =>
                  verificationMutation.mutate({ id: verification.id, status: "REJECTED" })
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
        {verifications.length === 0 ? (
          <div className="rounded-2xl border border-rose-100 bg-white/75 p-5 text-sm text-zinc-600">
            No manual verification requests are waiting.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function EventsPanel({
  concerts,
  events,
  onStatus,
  queryClient
}: {
  concerts: AdminConcert[];
  events: AdminEvent[];
  onStatus: (message: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}): React.JSX.Element {
  const publishMutation = useMutation({
    mutationFn: async ({
      id,
      isPublished,
      type
    }: {
      id: string;
      isPublished: boolean;
      type: "concert" | "event";
    }): Promise<unknown> =>
      type === "event"
        ? await updateAdminEventPublish(id, isPublished)
        : await updateAdminConcertPublish(id, isPublished),
    onError: (error: Error) => onStatus(error.message),
    onMutate: () => onStatus(null),
    onSuccess: (_result, variables) => {
      onStatus(`${variables.type} ${variables.isPublished ? "published" : "unpublished"}.`);
      invalidateAdmin(queryClient);
    }
  });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PublishPanel
        items={events.map((event) => ({
          city: event.city,
          id: event.id,
          isPublished: event.isPublished,
          startsAt: event.startsAt,
          subtitle: `${formatEnum(event.category)} - ${event.venue}`,
          title: event.title,
          type: "event" as const
        }))}
        onToggle={(item) =>
          publishMutation.mutate({
            id: item.id,
            isPublished: !item.isPublished,
            type: item.type
          })
        }
        pending={publishMutation.isPending}
        title="Events"
      />
      <PublishPanel
        items={concerts.map((concert) => ({
          city: concert.city,
          id: concert.id,
          isPublished: concert.isPublished,
          startsAt: concert.startsAt,
          subtitle: `${concert.artist} - ${concert.venue}`,
          title: concert.title,
          type: "concert" as const
        }))}
        onToggle={(item) =>
          publishMutation.mutate({
            id: item.id,
            isPublished: !item.isPublished,
            type: item.type
          })
        }
        pending={publishMutation.isPending}
        title="Concerts"
      />
    </div>
  );
}

function PublishPanel({
  items,
  onToggle,
  pending,
  title
}: {
  items: Array<{
    city: string;
    id: string;
    isPublished: boolean;
    startsAt: string;
    subtitle: string;
    title: string;
    type: "concert" | "event";
  }>;
  onToggle: (item: {
    city: string;
    id: string;
    isPublished: boolean;
    startsAt: string;
    subtitle: string;
    title: string;
    type: "concert" | "event";
  }) => void;
  pending: boolean;
  title: string;
}): React.JSX.Element {
  return (
    <Card className="p-5">
      <h2 className="font-display text-3xl text-royal-ink">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div
            className="grid gap-3 rounded-2xl border border-rose-100 bg-white/75 p-4 sm:grid-cols-[1fr_auto]"
            key={item.id}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-royal-ink">{item.title}</p>
                <Badge>{item.isPublished ? "Published" : "Draft"}</Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {item.subtitle} - {item.city}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{formatDate(item.startsAt)}</p>
            </div>
            <Button
              disabled={pending}
              onClick={() => onToggle(item)}
              size="sm"
              type="button"
              variant={item.isPublished ? "secondary" : "primary"}
            >
              {item.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BroadcastPanel({
  onStatus,
  queryClient
}: {
  onStatus: (message: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}): React.JSX.Element {
  const [audience, setAudience] = useState<"ACTIVE" | "ALL" | "CITY">("ACTIVE");
  const [channel, setChannel] = useState<AdminNotificationChannel>("IN_APP");
  const [type, setType] = useState<AdminNotificationType>("SYSTEM");
  const [title, setTitle] = useState("MatchA update");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("Jaipur");
  const broadcastMutation = useMutation({
    mutationFn: broadcastAdminNotification,
    onError: (error: Error) => onStatus(error.message),
    onMutate: () => onStatus(null),
    onSuccess: (result) => {
      setBody("");
      onStatus(`Broadcast created for ${result.broadcast.createdCount} users.`);
      invalidateAdmin(queryClient);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    broadcastMutation.mutate({
      audience,
      body,
      channel,
      city: audience === "CITY" ? city : undefined,
      title,
      type
    });
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-3xl text-royal-ink">Broadcast notification</h2>
      <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-royal-ink">
          Audience
          <Select
            onChange={(event) => setAudience(event.target.value as "ACTIVE" | "ALL" | "CITY")}
            value={audience}
          >
            <option value="ACTIVE">Active users</option>
            <option value="ALL">All non-deleted users</option>
            <option value="CITY">City</option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-royal-ink">
          Channel
          <Select
            onChange={(event) => setChannel(event.target.value as AdminNotificationChannel)}
            value={channel}
          >
            <option value="IN_APP">In-app</option>
            <option value="PUSH">Push</option>
            <option value="EMAIL">Email</option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-royal-ink">
          Type
          <Select
            onChange={(event) => setType(event.target.value as AdminNotificationType)}
            value={type}
          >
            <option value="SYSTEM">System</option>
            <option value="VERIFICATION">Verification</option>
            <option value="CONCERT_INVITATION">Concert</option>
            <option value="INSTANT_DATE_REQUEST">Instant date</option>
            <option value="MESSAGE">Message</option>
          </Select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-royal-ink">
          City
          <Input
            disabled={audience !== "CITY"}
            onChange={(event) => setCity(event.target.value)}
            value={city}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-royal-ink lg:col-span-2">
          Title
          <Input onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-royal-ink lg:col-span-2">
          Message
          <Textarea onChange={(event) => setBody(event.target.value)} value={body} />
        </label>
        <Button className="lg:col-span-2" disabled={broadcastMutation.isPending} type="submit">
          <Megaphone className="h-4 w-4" />
          {broadcastMutation.isPending ? "Sending..." : "Send broadcast"}
        </Button>
      </form>
    </Card>
  );
}

function AuditPanel({ logs }: { logs: AdminAuditLog[] }): React.JSX.Element {
  return (
    <Card className="p-5">
      <h2 className="font-display text-3xl text-royal-ink">Audit logs</h2>
      <div className="mt-5 grid gap-3">
        {logs.map((log) => (
          <AuditRow key={log.id} log={log} />
        ))}
      </div>
    </Card>
  );
}

function AuditRow({ log }: { log: AdminAuditLog }): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white/75 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{formatEnum(log.action)}</Badge>
        <p className="font-semibold text-royal-ink">{log.entity}</p>
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        {log.actor?.email ?? "System"} - {formatDate(log.createdAt)}
      </p>
      {log.entityId ? <p className="mt-1 text-xs text-zinc-500">{log.entityId}</p> : null}
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>): React.JSX.Element {
  return (
    <select
      className="h-11 w-full rounded-xl border border-rose-100 bg-white/80 px-4 text-sm text-royal-ink outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
      {...props}
    />
  );
}
