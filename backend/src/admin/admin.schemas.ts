import {
  EventCategory,
  NotificationChannel,
  NotificationType,
  ReportStatus,
  VerificationStatus
} from "@prisma/client";
import { z } from "zod";

export const adminListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).max(120).optional(),
    status: z.string().trim().min(1).max(80).optional()
  })
  .strict();

export const adminUserActionSchema = z
  .object({
    reason: z.string().trim().max(240).optional()
  })
  .strict();

export const adminReportReviewSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
    status: z.enum([ReportStatus.IN_REVIEW, ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  })
  .strict();

export const adminVerificationReviewSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
    status: z.enum([
      VerificationStatus.PHOTO_VERIFIED,
      VerificationStatus.ID_VERIFIED,
      VerificationStatus.REJECTED
    ])
  })
  .strict();

export const adminPublishSchema = z
  .object({
    isPublished: z.boolean()
  })
  .strict();

export const adminBroadcastSchema = z
  .object({
    audience: z.enum(["ALL", "ACTIVE", "CITY"]).default("ACTIVE"),
    body: z.string().trim().min(3).max(500),
    channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
    city: z.string().trim().min(1).max(80).optional(),
    title: z.string().trim().min(3).max(120),
    type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM)
  })
  .refine((value) => value.audience !== "CITY" || Boolean(value.city), {
    message: "City is required for city audience",
    path: ["city"]
  });

export const adminEventQuerySchema = adminListQuerySchema.extend({
  category: z.nativeEnum(EventCategory).optional()
});

export type AdminBroadcastInput = z.infer<typeof adminBroadcastSchema>;
export type AdminEventQuery = z.infer<typeof adminEventQuerySchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type AdminPublishInput = z.infer<typeof adminPublishSchema>;
export type AdminReportReviewInput = z.infer<typeof adminReportReviewSchema>;
export type AdminUserActionInput = z.infer<typeof adminUserActionSchema>;
export type AdminVerificationReviewInput = z.infer<typeof adminVerificationReviewSchema>;
