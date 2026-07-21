import { Gender, RelationshipGoal } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = (max = 120) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value ?? undefined);

const stringList = z.array(z.string().trim().min(1).max(48)).max(24);

const lifestyleSchema = z
  .object({
    exercise: z.string().trim().max(80).optional(),
    sleep: z.string().trim().max(80).optional(),
    weekends: z.string().trim().max(120).optional(),
    workStyle: z.string().trim().max(80).optional()
  })
  .strict()
  .partial();

export const profileUpdateSchema = z
  .object({
    age: z.coerce.number().int().min(18).max(80).optional(),
    bio: optionalTrimmedString(500),
    city: optionalTrimmedString(80),
    country: optionalTrimmedString(80),
    drinking: optionalTrimmedString(80),
    education: optionalTrimmedString(120),
    food: stringList.optional(),
    gender: z.nativeEnum(Gender).optional(),
    heightCm: z.coerce.number().int().min(120).max(230).optional(),
    interestedIn: z.array(z.nativeEnum(Gender)).min(1).max(4).optional(),
    interests: stringList.optional(),
    languages: stringList.optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    lifestyle: lifestyleSchema.optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    music: stringList.optional(),
    name: optionalTrimmedString(80),
    pets: optionalTrimmedString(80),
    profession: optionalTrimmedString(120),
    promptAnswers: z
      .record(z.string().trim().min(1).max(120), z.string().trim().max(280))
      .optional(),
    relationshipGoal: z.nativeEnum(RelationshipGoal).optional(),
    religion: optionalTrimmedString(80),
    smoking: optionalTrimmedString(80),
    state: optionalTrimmedString(80),
    travel: stringList.optional()
  })
  .strict();

export const photoCreateSchema = z
  .object({
    blurHash: z.string().trim().max(160).optional(),
    cloudinaryId: z.string().trim().min(1).max(180).optional(),
    isPrimary: z.boolean().optional(),
    url: z.string().trim().url().max(800)
  })
  .strict();

export const photoUploadSignatureSchema = z
  .object({
    purpose: z.enum(["PROFILE_PHOTO", "VERIFICATION_EVIDENCE"]).default("PROFILE_PHOTO")
  })
  .strict();

export const verificationRequestSchema = z
  .object({
    evidenceUrl: z.string().trim().url().max(800),
    type: z.enum(["PHOTO_SELFIE", "GOVERNMENT_ID"])
  })
  .strict();

export type PhotoCreateInput = z.infer<typeof photoCreateSchema>;
export type PhotoUploadSignatureInput = z.infer<typeof photoUploadSignatureSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type VerificationRequestInput = z.infer<typeof verificationRequestSchema>;
