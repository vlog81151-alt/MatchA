import { ParticipantStatus } from "@prisma/client";
import { z } from "zod";

export const concertIntentSchema = z.enum([
  "concert_buddy",
  "new_friends",
  "maybe_more",
  "group_vibe"
]);

export const concertQuerySchema = z
  .object({
    city: z.string().trim().min(1).max(80).optional(),
    genre: z.string().trim().min(1).max(80).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    q: z.string().trim().min(1).max(120).optional()
  })
  .strict();

export const concertJoinSchema = z
  .object({
    intent: concertIntentSchema,
    status: z
      .enum([ParticipantStatus.INTERESTED, ParticipantStatus.JOINED])
      .default(ParticipantStatus.JOINED)
  })
  .strict();

export const concertIntentUpdateSchema = z
  .object({
    intent: concertIntentSchema
  })
  .strict();

export type ConcertIntent = z.infer<typeof concertIntentSchema>;
export type ConcertIntentUpdateInput = z.infer<typeof concertIntentUpdateSchema>;
export type ConcertJoinInput = z.infer<typeof concertJoinSchema>;
export type ConcertQuery = z.infer<typeof concertQuerySchema>;
