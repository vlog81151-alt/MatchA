import { Gender, LikeType, RelationshipGoal } from "@prisma/client";
import { z } from "zod";

export const recommendationQuerySchema = z
  .object({
    ageMax: z.coerce.number().int().min(18).max(80).optional(),
    ageMin: z.coerce.number().int().min(18).max(80).optional(),
    gender: z.nativeEnum(Gender).optional(),
    interest: z.string().trim().min(1).max(80).optional(),
    lifestyle: z.string().trim().min(1).max(80).optional(),
    limit: z.coerce.number().int().min(1).max(25).default(10),
    maxDistanceKm: z.coerce.number().int().min(1).max(500).optional(),
    profession: z.string().trim().min(1).max(120).optional(),
    relationshipGoal: z.nativeEnum(RelationshipGoal).optional(),
    religion: z.string().trim().min(1).max(80).optional()
  })
  .strict()
  .refine(
    (value) =>
      value.ageMin === undefined || value.ageMax === undefined || value.ageMin <= value.ageMax,
    {
      message: "ageMin must be less than or equal to ageMax",
      path: ["ageMin"]
    }
  );

export const matchActionSchema = z
  .object({
    targetUserId: z.string().trim().min(1)
  })
  .strict();

export const likeActionSchema = matchActionSchema.extend({
  type: z.nativeEnum(LikeType).default(LikeType.LIKE)
});

export const matchingFiltersSchema = z
  .object({
    maxAge: z.coerce.number().int().min(18).max(80).optional(),
    maxDistanceKm: z.coerce.number().int().min(1).max(500).optional(),
    minAge: z.coerce.number().int().min(18).max(80).optional(),
    showDistance: z.boolean().optional()
  })
  .strict()
  .refine(
    (value) =>
      value.minAge === undefined || value.maxAge === undefined || value.minAge <= value.maxAge,
    {
      message: "minAge must be less than or equal to maxAge",
      path: ["minAge"]
    }
  );

export type LikeActionInput = z.infer<typeof likeActionSchema>;
export type MatchActionInput = z.infer<typeof matchActionSchema>;
export type MatchingFiltersInput = z.infer<typeof matchingFiltersSchema>;
export type RecommendationQuery = z.infer<typeof recommendationQuerySchema>;
