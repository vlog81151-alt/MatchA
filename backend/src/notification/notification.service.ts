import { createHash } from "node:crypto";

import type { Notification, Prisma, PushToken, Settings } from "@prisma/client";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  NotificationPreferencesInput,
  NotificationQuery,
  NotificationReadAllInput,
  PushTokenRegisterInput,
  PushTokenRevokeInput
} from "./notification.schemas.js";

function serializeNotification(notification: Notification) {
  return {
    body: notification.body,
    channel: notification.channel,
    createdAt: notification.createdAt.toISOString(),
    data: notification.data,
    id: notification.id,
    readAt: notification.readAt?.toISOString() ?? null,
    sentAt: notification.sentAt?.toISOString() ?? null,
    title: notification.title,
    type: notification.type
  };
}

function serializePreferences(settings: Settings) {
  return {
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications
  };
}

function serializePushToken(pushToken: PushToken) {
  return {
    createdAt: pushToken.createdAt.toISOString(),
    deviceId: pushToken.deviceId,
    id: pushToken.id,
    lastSeenAt: pushToken.lastSeenAt.toISOString(),
    platform: pushToken.platform,
    revokedAt: pushToken.revokedAt?.toISOString() ?? null,
    updatedAt: pushToken.updatedAt.toISOString(),
    userAgent: pushToken.userAgent
  };
}

async function ensureUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user || user.deletedAt || user.isBanned) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  return user;
}

function hashPushToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function notificationWhere(
  userId: string,
  query: NotificationQuery
): Prisma.NotificationWhereInput {
  return {
    channel: query.channel,
    readAt: query.unread ? null : undefined,
    type: query.type,
    userId
  };
}

function readAllWhere(
  userId: string,
  input: NotificationReadAllInput
): Prisma.NotificationWhereInput {
  return {
    channel: input.channel,
    readAt: null,
    type: input.type,
    userId
  };
}

export async function listNotifications(userId: string, query: NotificationQuery) {
  await ensureUser(userId);

  const notifications = await prisma.notification.findMany({
    cursor: query.cursor
      ? {
          id: query.cursor
        }
      : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: query.cursor ? 1 : 0,
    take: query.limit + 1,
    where: notificationWhere(userId, query)
  });
  const page = notifications.slice(0, query.limit);
  const nextCursor = notifications.length > query.limit ? (page.at(-1)?.id ?? null) : null;
  const unreadCount = await prisma.notification.count({
    where: {
      readAt: null,
      userId
    }
  });

  return {
    nextCursor,
    notifications: page.map(serializeNotification),
    unreadCount
  };
}

export async function getUnreadNotificationCount(userId: string) {
  await ensureUser(userId);

  const unreadCount = await prisma.notification.count({
    where: {
      readAt: null,
      userId
    }
  });

  return {
    unreadCount
  };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await ensureUser(userId);

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  const updatedNotification = await prisma.notification.update({
    data: {
      readAt: notification.readAt ?? new Date()
    },
    where: {
      id: notification.id
    }
  });

  return {
    notification: serializeNotification(updatedNotification)
  };
}

export async function markAllNotificationsRead(userId: string, input: NotificationReadAllInput) {
  await ensureUser(userId);

  const result = await prisma.notification.updateMany({
    data: {
      readAt: new Date()
    },
    where: readAllWhere(userId, input)
  });

  return {
    updatedCount: result.count
  };
}

export async function deleteNotification(userId: string, notificationId: string) {
  await ensureUser(userId);

  const notification = await prisma.notification.findFirst({
    select: {
      id: true
    },
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  await prisma.notification.delete({
    where: {
      id: notification.id
    }
  });

  return {
    deleted: true,
    id: notification.id
  };
}

export async function getNotificationPreferences(userId: string) {
  await ensureUser(userId);

  const settings = await prisma.settings.upsert({
    create: {
      userId
    },
    update: {},
    where: {
      userId
    }
  });

  return {
    preferences: serializePreferences(settings)
  };
}

export async function updateNotificationPreferences(
  userId: string,
  input: NotificationPreferencesInput
) {
  await ensureUser(userId);

  const settings = await prisma.settings.upsert({
    create: {
      emailNotifications: input.emailNotifications ?? true,
      pushNotifications: input.pushNotifications ?? true,
      userId
    },
    update: {
      emailNotifications: input.emailNotifications,
      pushNotifications: input.pushNotifications
    },
    where: {
      userId
    }
  });

  return {
    preferences: serializePreferences(settings)
  };
}

export async function listPushTokens(userId: string) {
  await ensureUser(userId);

  const pushTokens = await prisma.pushToken.findMany({
    orderBy: {
      lastSeenAt: "desc"
    },
    where: {
      revokedAt: null,
      userId
    }
  });

  return {
    pushTokens: pushTokens.map(serializePushToken)
  };
}

export async function registerPushToken(userId: string, input: PushTokenRegisterInput) {
  await ensureUser(userId);

  const pushToken = await prisma.pushToken.upsert({
    create: {
      deviceId: input.deviceId,
      lastSeenAt: new Date(),
      platform: input.platform,
      token: input.token,
      tokenHash: hashPushToken(input.token),
      userAgent: input.userAgent,
      userId
    },
    update: {
      deviceId: input.deviceId,
      lastSeenAt: new Date(),
      platform: input.platform,
      revokedAt: null,
      token: input.token,
      userAgent: input.userAgent,
      userId
    },
    where: {
      tokenHash: hashPushToken(input.token)
    }
  });

  return {
    pushToken: serializePushToken(pushToken)
  };
}

export async function revokePushToken(userId: string, input: PushTokenRevokeInput) {
  await ensureUser(userId);

  const pushToken = await prisma.pushToken.findFirst({
    where: {
      revokedAt: null,
      tokenHash: hashPushToken(input.token),
      userId
    }
  });

  if (!pushToken) {
    return {
      revoked: false
    };
  }

  const revokedPushToken = await prisma.pushToken.update({
    data: {
      revokedAt: new Date()
    },
    where: {
      id: pushToken.id
    }
  });

  return {
    pushToken: serializePushToken(revokedPushToken),
    revoked: true
  };
}
