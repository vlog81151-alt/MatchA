import { InstantDateActivity } from "@prisma/client";
import { z } from "zod";

export const timeWindowSchema = z.enum(["now", "tonight", "this_weekend", "custom"]);

export const instantDateQuerySchema = z
  .object({
    status: z.enum(["active", "pending", "accepted", "history"]).default("active")
  })
  .strict();

export const instantDateCreateSchema = z
  .object({
    activity: z.nativeEnum(InstantDateActivity),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    proposedAt: z.coerce.date().optional(),
    timeWindow: timeWindowSchema,
    venue: z.string().trim().min(2).max(120).optional()
  })
  .strict()
  .refine(
    (value) =>
      (value.latitude === undefined && value.longitude === undefined) ||
      (value.latitude !== undefined && value.longitude !== undefined),
    {
      message: "Latitude and longitude must be provided together",
      path: ["latitude"]
    }
  )
  .refine((value) => value.timeWindow !== "custom" || value.proposedAt !== undefined, {
    message: "Custom instant dates require proposedAt",
    path: ["proposedAt"]
  });

export const instantDateRescheduleSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    proposedAt: z.coerce.date().optional(),
    timeWindow: timeWindowSchema.optional(),
    venue: z.string().trim().min(2).max(120).optional()
  })
  .strict()
  .refine(
    (value) =>
      (value.latitude === undefined && value.longitude === undefined) ||
      (value.latitude !== undefined && value.longitude !== undefined),
    {
      message: "Latitude and longitude must be provided together",
      path: ["latitude"]
    }
  )
  .refine(
    (value) =>
      value.latitude !== undefined ||
      value.longitude !== undefined ||
      value.proposedAt !== undefined ||
      value.timeWindow !== undefined ||
      value.venue !== undefined,
    {
      message: "Provide at least one reschedule field"
    }
  )
  .refine((value) => value.timeWindow !== "custom" || value.proposedAt !== undefined, {
    message: "Custom instant dates require proposedAt",
    path: ["proposedAt"]
  });

export const liveLocationSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180)
  })
  .strict();

export type InstantDateCreateInput = z.infer<typeof instantDateCreateSchema>;
export type InstantDateQuery = z.infer<typeof instantDateQuerySchema>;
export type InstantDateRescheduleInput = z.infer<typeof instantDateRescheduleSchema>;
export type LiveLocationInput = z.infer<typeof liveLocationSchema>;
