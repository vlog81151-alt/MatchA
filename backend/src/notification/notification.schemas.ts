import { NotificationChannel, NotificationType } from "@prisma/client";
import { z } from "zod";

export const notificationChannelSchema = z.nativeEnum(NotificationChannel);
export const notificationTypeSchema = z.nativeEnum(NotificationType);
export const pushTokenPlatformSchema = z.enum(["WEB", "IOS", "ANDROID"]);

export const notificationQuerySchema = z
  .object({
    channel: notificationChannelSchema.optional(),
    cursor: z.string().cuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: notificationTypeSchema.optional(),
    unread: z.coerce.boolean().optional()
  })
  .strict();

export const notificationReadAllSchema = z
  .object({
    channel: notificationChannelSchema.optional(),
    type: notificationTypeSchema.optional()
  })
  .strict();

export const notificationPreferencesSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional()
  })
  .refine(
    (value) => value.emailNotifications !== undefined || value.pushNotifications !== undefined,
    {
      message: "At least one preference must be provided"
    }
  );

export const pushTokenRegisterSchema = z
  .object({
    deviceId: z.string().trim().min(1).max(160).optional(),
    platform: pushTokenPlatformSchema.default("WEB"),
    token: z.string().trim().min(20).max(4096),
    userAgent: z.string().trim().max(300).optional()
  })
  .strict();

export const pushTokenRevokeSchema = z
  .object({
    token: z.string().trim().min(20).max(4096)
  })
  .strict();

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationReadAllInput = z.infer<typeof notificationReadAllSchema>;
export type PushTokenRegisterInput = z.infer<typeof pushTokenRegisterSchema>;
export type PushTokenRevokeInput = z.infer<typeof pushTokenRevokeSchema>;
