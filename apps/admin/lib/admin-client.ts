const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type AdminReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
export type AdminVerificationStatus =
  | "UNVERIFIED"
  | "PHOTO_VERIFIED"
  | "ID_VERIFIED"
  | "MANUAL_REVIEW"
  | "REJECTED";
export type AdminNotificationChannel = "IN_APP" | "PUSH" | "EMAIL";
export type AdminNotificationType =
  | "LIKE"
  | "MATCH"
  | "MESSAGE"
  | "CONCERT_INVITATION"
  | "INSTANT_DATE_REQUEST"
  | "PROFILE_VIEW"
  | "VERIFICATION"
  | "SYSTEM";

export interface AdminAuthUser {
  email: string;
  emailVerifiedAt: string | null;
  id: string;
  name: string | null;
  profileCompletion: number;
  role: string;
  verificationStatus: string;
}

export interface AdminUser {
  age: number | null;
  bannedAt: string | null;
  city: string | null;
  createdAt: string;
  deletedAt: string | null;
  email: string;
  id: string;
  isBanned: boolean;
  name: string | null;
  primaryPhoto: string | null;
  profileCompletion: number;
  role: string;
  updatedAt: string;
  verificationStatus: AdminVerificationStatus;
}

export interface AdminMetrics {
  activeUsers: number;
  bannedUsers: number;
  deletedUsers: number;
  instantDateRequests: number;
  newUsersThisWeek: number;
  openReports: number;
  pendingReports: number;
  publishedConcerts: number;
  publishedEvents: number;
  totalMatches: number;
  totalMessages: number;
  totalUsers: number;
  verificationQueue: number;
}

export interface AdminAuditLog {
  action: string;
  actor: {
    email: string;
    id: string;
    name: string | null;
    role: string;
  } | null;
  createdAt: string;
  entity: string;
  entityId: string | null;
  id: string;
  ipAddress: string | null;
  metadata: unknown;
  userAgent: string | null;
}

export interface AdminReport {
  createdAt: string;
  description: string | null;
  id: string;
  metadata: unknown;
  reason: string;
  reportedUser: Pick<AdminUser, "email" | "id" | "isBanned" | "name" | "verificationStatus">;
  reporter: Pick<AdminUser, "email" | "id" | "name">;
  resolvedAt: string | null;
  status: AdminReportStatus;
  updatedAt: string;
}

export interface AdminVerification {
  createdAt: string;
  evidenceUrl: string | null;
  id: string;
  providerRef: string | null;
  reason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  status: AdminVerificationStatus;
  type: string;
  updatedAt: string;
  user: {
    email: string;
    id: string;
    name: string | null;
    primaryPhoto: string | null;
    verificationStatus: AdminVerificationStatus;
  };
}

export interface AdminEvent {
  category: string;
  city: string;
  coverImage: string | null;
  createdAt: string;
  endsAt: string | null;
  id: string;
  isPublished: boolean;
  startsAt: string;
  title: string;
  updatedAt: string;
  venue: string;
}

export interface AdminConcert {
  artist: string;
  city: string;
  coverImage: string | null;
  createdAt: string;
  genreTags: string[];
  id: string;
  isPublished: boolean;
  startsAt: string;
  title: string;
  updatedAt: string;
  venue: string;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse & ApiErrorPayload> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as TResponse & ApiErrorPayload;
  }

  const text = await response.text();

  return {
    error: {
      message: text || `Request failed with status ${response.status}`
    }
  } as TResponse & ApiErrorPayload;
}

async function requestJson<TResponse>(
  path: string,
  options: RequestInit & { body?: BodyInit | null } = {}
): Promise<TResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload = await parseResponse<TResponse>(response);

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Admin request failed");
  }

  return payload;
}

function search(params: Record<string, number | string | undefined> = {}): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const value = query.toString();

  return value ? `?${value}` : "";
}

export function loginAdmin(payload: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<{ user: AdminAuthUser }> {
  return requestJson("/auth/login", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function logoutAdmin(): Promise<void> {
  return requestJson("/auth/logout", {
    method: "POST"
  });
}

export function getAdminMe(): Promise<{ admin: AdminUser }> {
  return requestJson("/admin/me");
}

export function getAdminDashboard(): Promise<{
  metrics: AdminMetrics;
  recentAuditLogs: AdminAuditLog[];
}> {
  return requestJson("/admin/dashboard");
}

export function listAdminUsers(
  params: {
    limit?: number;
    q?: string;
    status?: string;
  } = {}
): Promise<{ users: AdminUser[] }> {
  return requestJson(`/admin/users${search(params)}`);
}

export function banAdminUser(id: string): Promise<{ user: AdminUser }> {
  return requestJson(`/admin/users/${id}/ban`, {
    body: JSON.stringify({
      reason: "Admin moderation action"
    }),
    method: "PATCH"
  });
}

export function unbanAdminUser(id: string): Promise<{ user: AdminUser }> {
  return requestJson(`/admin/users/${id}/unban`, {
    body: JSON.stringify({
      reason: "Admin moderation action"
    }),
    method: "PATCH"
  });
}

export function deleteAdminUser(id: string): Promise<{ user: AdminUser }> {
  return requestJson(`/admin/users/${id}`, {
    body: JSON.stringify({
      reason: "Admin account removal"
    }),
    method: "DELETE"
  });
}

export function listAdminReports(
  params: {
    limit?: number;
    q?: string;
    status?: string;
  } = {}
): Promise<{ reports: AdminReport[] }> {
  return requestJson(`/admin/reports${search(params)}`);
}

export function reviewAdminReport(
  id: string,
  payload: { reason?: string; status: AdminReportStatus }
): Promise<{ report: AdminReport }> {
  return requestJson(`/admin/reports/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function listAdminVerifications(
  params: {
    limit?: number;
    q?: string;
    status?: string;
  } = {}
): Promise<{ verifications: AdminVerification[] }> {
  return requestJson(`/admin/verifications${search(params)}`);
}

export function reviewAdminVerification(
  id: string,
  payload: { reason?: string; status: "ID_VERIFIED" | "PHOTO_VERIFIED" | "REJECTED" }
): Promise<{ verification: AdminVerification }> {
  return requestJson(`/admin/verifications/${id}/review`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function listAdminEvents(
  params: {
    category?: string;
    limit?: number;
    q?: string;
    status?: string;
  } = {}
): Promise<{ events: AdminEvent[] }> {
  return requestJson(`/admin/events${search(params)}`);
}

export function updateAdminEventPublish(
  id: string,
  isPublished: boolean
): Promise<{ event: AdminEvent }> {
  return requestJson(`/admin/events/${id}/publish`, {
    body: JSON.stringify({ isPublished }),
    method: "PATCH"
  });
}

export function listAdminConcerts(
  params: {
    limit?: number;
    q?: string;
    status?: string;
  } = {}
): Promise<{ concerts: AdminConcert[] }> {
  return requestJson(`/admin/concerts${search(params)}`);
}

export function updateAdminConcertPublish(
  id: string,
  isPublished: boolean
): Promise<{ concert: AdminConcert }> {
  return requestJson(`/admin/concerts/${id}/publish`, {
    body: JSON.stringify({ isPublished }),
    method: "PATCH"
  });
}

export function broadcastAdminNotification(payload: {
  audience: "ACTIVE" | "ALL" | "CITY";
  body: string;
  channel: AdminNotificationChannel;
  city?: string;
  title: string;
  type: AdminNotificationType;
}): Promise<{
  broadcast: {
    audience: string;
    createdCount: number;
  };
}> {
  return requestJson("/admin/broadcasts", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function listAdminAuditLogs(
  params: {
    limit?: number;
    q?: string;
    status?: string;
  } = {}
): Promise<{ auditLogs: AdminAuditLog[] }> {
  return requestJson(`/admin/audit-logs${search(params)}`);
}
