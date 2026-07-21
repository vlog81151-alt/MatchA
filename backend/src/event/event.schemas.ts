import { EventCategory, ParticipantStatus } from "@prisma/client";
import { z } from "zod";

export const eventCategorySchema = z.nativeEnum(EventCategory);

export const eventQuerySchema = z
  .object({
    category: eventCategorySchema.optional(),
    city: z.string().trim().min(1).max(80).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    q: z.string().trim().min(1).max(120).optional()
  })
  .strict();

export const eventParticipationSchema = z
  .object({
    status: z
      .enum([ParticipantStatus.INTERESTED, ParticipantStatus.JOINED])
      .default(ParticipantStatus.JOINED)
  })
  .strict();

export const eventInviteSchema = z
  .object({
    message: z.string().trim().max(240).optional(),
    recipientUserId: z.string().cuid()
  })
  .strict();

export type EventInviteInput = z.infer<typeof eventInviteSchema>;
export type EventParticipationInput = z.infer<typeof eventParticipationSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;
