import { buildSearchParams, requestJson } from "./http-client";

export type NotificationChannel = "IN_APP" | "PUSH" | "EMAIL";
export type PushTokenPlatform = "ANDROID" | "IOS" | "WEB";

export type NotificationType =
  | "LIKE"
  | "MATCH"
  | "MESSAGE"
  | "CONCERT_INVITATION"
  | "INSTANT_DATE_REQUEST"
  | "PROFILE_VIEW"
  | "VERIFICATION"
  | "SYSTEM";

export interface NotificationItem {
  body: string;
  channel: NotificationChannel;
  createdAt: string;
  data: unknown;
  id: string;
  readAt: string | null;
  sentAt: string | null;
  title: string;
  type: NotificationType;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface PushTokenRegistration {
  createdAt: string;
  deviceId: string | null;
  id: string;
  lastSeenAt: string;
  platform: string;
  revokedAt: string | null;
  updatedAt: string;
  userAgent: string | null;
}

export interface NotificationQuery {
  channel?: NotificationChannel;
  cursor?: string;
  limit?: number;
  type?: NotificationType;
  unread?: boolean;
}

function search(params: NotificationQuery): string {
  return buildSearchParams(params);
}

export function listNotifications(query: NotificationQuery = {}): Promise<{
  nextCursor: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  return requestJson(`/notifications${search(query)}`);
}

export function getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return requestJson("/notifications/unread-count");
}

export function markNotificationRead(id: string): Promise<{ notification: NotificationItem }> {
  return requestJson(`/notifications/${id}/read`, {
    method: "PATCH"
  });
}

export function markAllNotificationsRead(
  payload: {
    channel?: NotificationChannel;
    type?: NotificationType;
  } = {}
): Promise<{ updatedCount: number }> {
  return requestJson("/notifications/read-all", {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function deleteNotification(id: string): Promise<{ deleted: true; id: string }> {
  return requestJson(`/notifications/${id}`, {
    method: "DELETE"
  });
}

export function getNotificationPreferences(): Promise<{
  preferences: NotificationPreferences;
}> {
  return requestJson("/notifications/preferences");
}

export function updateNotificationPreferences(
  payload: Partial<NotificationPreferences>
): Promise<{ preferences: NotificationPreferences }> {
  return requestJson("/notifications/preferences", {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function listPushTokens(): Promise<{ pushTokens: PushTokenRegistration[] }> {
  return requestJson("/notifications/push-tokens");
}

export function registerPushToken(payload: {
  deviceId?: string;
  platform?: PushTokenPlatform;
  token: string;
  userAgent?: string;
}): Promise<{ pushToken: PushTokenRegistration }> {
  return requestJson("/notifications/push-tokens", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function revokePushToken(payload: {
  token: string;
}): Promise<{ pushToken?: PushTokenRegistration; revoked: boolean }> {
  return requestJson("/notifications/push-tokens/revoke", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}
