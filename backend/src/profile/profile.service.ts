import { createHash } from "node:crypto";

import {
  AuditAction,
  NotificationChannel,
  NotificationType,
  PhotoStatus,
  Prisma,
  VerificationStatus,
  type Interest,
  type Photo,
  type PrismaClient,
  type Settings,
  type User,
  type UserInterest,
  type Verification
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import { createCloudinaryUploadSignature } from "../media/cloudinary.service.js";
import type {
  PhotoCreateInput,
  PhotoUploadSignatureInput,
  ProfileUpdateInput,
  VerificationRequestInput
} from "./profile.schemas.js";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type ProfileUser = User & {
  interests: Array<UserInterest & { interest: Interest }>;
  photos: Photo[];
  settings: Settings | null;
  verifications: Verification[];
};

type CompletionSnapshot = Pick<
  ProfileUser,
  | "age"
  | "bio"
  | "city"
  | "country"
  | "education"
  | "food"
  | "gender"
  | "heightCm"
  | "interestedIn"
  | "languages"
  | "music"
  | "name"
  | "profession"
  | "promptAnswers"
  | "relationshipGoal"
  | "state"
  | "travel"
> & {
  interests: Array<UserInterest & { interest: Interest }>;
  photos: Photo[];
};

const profileInclude = {
  interests: {
    include: {
      interest: true
    }
  },
  photos: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  },
  settings: true,
  verifications: {
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  }
} satisfies Prisma.UserInclude;

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArray<T>(value: T[] | null | undefined, min = 1): boolean {
  return Array.isArray(value) && value.length >= min;
}

function hasPromptAnswers(value: Prisma.JsonValue): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).some((answer) => typeof answer === "string" && answer.trim());
}

function calculateProfileCompletion(profile: CompletionSnapshot): number {
  let score = 0;

  if (hasText(profile.name) && profile.age && profile.gender && hasArray(profile.interestedIn)) {
    score += 15;
  }

  if (hasText(profile.city) && hasText(profile.state) && hasText(profile.country)) {
    score += 10;
  }

  if (hasText(profile.profession) && hasText(profile.education) && profile.heightCm) {
    score += 10;
  }

  if (hasText(profile.bio)) {
    score += 10;
  }

  if (hasPromptAnswers(profile.promptAnswers)) {
    score += 10;
  }

  if (profile.photos.some((photo) => photo.isPrimary)) {
    score += 15;
  }

  if (profile.photos.length >= 3) {
    score += 5;
  }

  if (profile.interests.length >= 4) {
    score += 10;
  }

  if (
    profile.relationshipGoal &&
    hasArray(profile.languages) &&
    hasArray(profile.music) &&
    hasArray(profile.food) &&
    hasArray(profile.travel)
  ) {
    score += 15;
  }

  return Math.min(score, 100);
}

function serializeDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function serializeDecimal(value: Prisma.Decimal | null): string | null {
  return value?.toString() ?? null;
}

function serializeProfile(profile: ProfileUser) {
  return {
    age: profile.age,
    bio: profile.bio,
    city: profile.city,
    country: profile.country,
    createdAt: profile.createdAt.toISOString(),
    drinking: profile.drinking,
    education: profile.education,
    email: profile.email,
    emailVerifiedAt: serializeDate(profile.emailVerifiedAt),
    food: profile.food,
    gender: profile.gender,
    heightCm: profile.heightCm,
    id: profile.id,
    interestedIn: profile.interestedIn,
    interests: profile.interests
      .map(({ interest }) => ({
        category: interest.category,
        id: interest.id,
        name: interest.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    languages: profile.languages,
    latitude: serializeDecimal(profile.latitude),
    lifestyle: profile.lifestyle,
    longitude: serializeDecimal(profile.longitude),
    music: profile.music,
    name: profile.name,
    pets: profile.pets,
    photos: profile.photos.map((photo) => ({
      blurHash: photo.blurHash,
      createdAt: photo.createdAt.toISOString(),
      id: photo.id,
      isPrimary: photo.isPrimary,
      sortOrder: photo.sortOrder,
      status: photo.status,
      url: photo.url
    })),
    profession: profile.profession,
    profileCompletion: profile.profileCompletion,
    promptAnswers: profile.promptAnswers,
    relationshipGoal: profile.relationshipGoal,
    religion: profile.religion,
    settings: profile.settings,
    smoking: profile.smoking,
    state: profile.state,
    travel: profile.travel,
    updatedAt: profile.updatedAt.toISOString(),
    verificationStatus: profile.verificationStatus,
    verifications: profile.verifications.map((verification) => ({
      createdAt: verification.createdAt.toISOString(),
      id: verification.id,
      reason: verification.reason,
      reviewedAt: serializeDate(verification.reviewedAt),
      status: verification.status,
      type: verification.type
    }))
  };
}

async function loadProfile(
  userId: string,
  client: TransactionClient = prisma
): Promise<ProfileUser> {
  const profile = await client.user.findUnique({
    include: profileInclude,
    where: {
      id: userId
    }
  });

  if (!profile || profile.deletedAt) {
    throw new HttpError(404, "PROFILE_NOT_FOUND", "Profile not found");
  }

  return profile;
}

async function refreshCompletion(
  userId: string,
  client: TransactionClient = prisma
): Promise<ProfileUser> {
  const profile = await loadProfile(userId, client);
  const profileCompletion = calculateProfileCompletion(profile);

  if (profile.profileCompletion === profileCompletion) {
    return profile;
  }

  return client.user.update({
    data: {
      profileCompletion
    },
    include: profileInclude,
    where: {
      id: userId
    }
  });
}

function externalCloudinaryId(userId: string, url: string): string {
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 24);

  return `external/${userId}/${digest}`;
}

async function replaceInterests(
  client: TransactionClient,
  userId: string,
  interestNames: string[]
): Promise<void> {
  const normalizedNames = [...new Set(interestNames.map((name) => name.trim()).filter(Boolean))];

  await client.userInterest.deleteMany({
    where: {
      userId
    }
  });

  for (const name of normalizedNames) {
    const interest = await client.interest.upsert({
      create: {
        category: "User selected",
        name
      },
      update: {},
      where: {
        name
      }
    });

    await client.userInterest.create({
      data: {
        interestId: interest.id,
        userId
      }
    });
  }
}

export async function getProfile(userId: string) {
  const profile = await refreshCompletion(userId);

  return serializeProfile(profile);
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const { interests, latitude, lifestyle, longitude, promptAnswers, ...profileInput } = input;

  const profile = await prisma.$transaction(async (client) => {
    await client.user.update({
      data: {
        ...profileInput,
        latitude: latitude === undefined ? undefined : new Prisma.Decimal(latitude),
        lifestyle: lifestyle === undefined ? undefined : lifestyle,
        longitude: longitude === undefined ? undefined : new Prisma.Decimal(longitude),
        promptAnswers: promptAnswers === undefined ? undefined : promptAnswers
      },
      where: {
        id: userId
      }
    });

    if (interests) {
      await replaceInterests(client, userId, interests);
    }

    await client.auditLog.create({
      data: {
        action: AuditAction.PROFILE_UPDATED,
        actorId: userId,
        entity: "User",
        entityId: userId,
        metadata: {
          fields: Object.keys(input)
        }
      }
    });

    return refreshCompletion(userId, client);
  });

  return serializeProfile(profile);
}

export async function addProfilePhoto(userId: string, input: PhotoCreateInput) {
  const profile = await prisma.$transaction(async (client) => {
    const existingCount = await client.photo.count({
      where: {
        userId
      }
    });
    const shouldBePrimary = input.isPrimary === true || existingCount === 0;

    if (shouldBePrimary) {
      await client.photo.updateMany({
        data: {
          isPrimary: false
        },
        where: {
          userId
        }
      });
    }

    await client.photo.create({
      data: {
        blurHash: input.blurHash,
        cloudinaryId: input.cloudinaryId ?? externalCloudinaryId(userId, input.url),
        isPrimary: shouldBePrimary,
        sortOrder: existingCount,
        status: PhotoStatus.PENDING,
        url: input.url,
        userId
      }
    });

    return refreshCompletion(userId, client);
  });

  return serializeProfile(profile);
}

export async function createProfilePhotoUploadSignature(
  userId: string,
  input: PhotoUploadSignatureInput
) {
  await loadProfile(userId);

  return {
    upload: createCloudinaryUploadSignature(userId, input.purpose)
  };
}

export async function setPrimaryPhoto(userId: string, photoId: string) {
  const profile = await prisma.$transaction(async (client) => {
    const photo = await client.photo.findFirst({
      where: {
        id: photoId,
        userId
      }
    });

    if (!photo) {
      throw new HttpError(404, "PHOTO_NOT_FOUND", "Photo not found");
    }

    await client.photo.updateMany({
      data: {
        isPrimary: false
      },
      where: {
        userId
      }
    });

    await client.photo.update({
      data: {
        isPrimary: true
      },
      where: {
        id: photoId
      }
    });

    return refreshCompletion(userId, client);
  });

  return serializeProfile(profile);
}

export async function deleteProfilePhoto(userId: string, photoId: string) {
  const profile = await prisma.$transaction(async (client) => {
    const photo = await client.photo.findFirst({
      where: {
        id: photoId,
        userId
      }
    });

    if (!photo) {
      throw new HttpError(404, "PHOTO_NOT_FOUND", "Photo not found");
    }

    await client.photo.delete({
      where: {
        id: photoId
      }
    });

    if (photo.isPrimary) {
      const nextPhoto = await client.photo.findFirst({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        where: {
          userId
        }
      });

      if (nextPhoto) {
        await client.photo.update({
          data: {
            isPrimary: true
          },
          where: {
            id: nextPhoto.id
          }
        });
      }
    }

    return refreshCompletion(userId, client);
  });

  return serializeProfile(profile);
}

export async function requestProfileVerification(userId: string, input: VerificationRequestInput) {
  const profile = await prisma.$transaction(async (client) => {
    await client.verification.create({
      data: {
        evidenceUrl: input.evidenceUrl,
        status: VerificationStatus.MANUAL_REVIEW,
        type: input.type,
        userId
      }
    });

    await client.user.update({
      data: {
        verificationStatus: VerificationStatus.MANUAL_REVIEW
      },
      where: {
        id: userId
      }
    });

    await client.notification.create({
      data: {
        body: "Your verification request is in manual review.",
        channel: NotificationChannel.IN_APP,
        data: {
          type: input.type
        },
        title: "Verification submitted",
        type: NotificationType.VERIFICATION,
        userId
      }
    });

    return refreshCompletion(userId, client);
  });

  return serializeProfile(profile);
}
