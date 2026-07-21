import {
  InstantDateStatus,
  MatchStatus,
  NotificationChannel,
  NotificationType,
  type InstantDate,
  type InstantDateActivity,
  type Interest,
  type Photo,
  Prisma,
  type Settings,
  type User,
  type UserInterest
} from "@prisma/client";
import xss from "xss";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  InstantDateCreateInput,
  InstantDateQuery,
  InstantDateRescheduleInput,
  LiveLocationInput
} from "./instant-date.schemas.js";

type InstantDateUser = User & {
  interests: Array<UserInterest & { interest: Interest }>;
  photos: Photo[];
  settings: Settings | null;
};

type InstantDateRecord = InstantDate & {
  recipient: InstantDateUser | null;
  requester: InstantDateUser;
};

const userInclude = {
  interests: {
    include: {
      interest: true
    }
  },
  photos: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  },
  settings: true
} satisfies Prisma.UserInclude;

const activeStatuses: InstantDateStatus[] = [
  InstantDateStatus.PENDING,
  InstantDateStatus.ACCEPTED,
  InstantDateStatus.RESCHEDULED
];
const pendingStatuses: InstantDateStatus[] = [
  InstantDateStatus.PENDING,
  InstantDateStatus.RESCHEDULED
];

const activityVenues: Record<InstantDateActivity, string> = {
  ART: "Jawahar Kala Kendra",
  CASUAL: "Central Park Jaipur",
  COFFEE: "Half Light Coffee Roasters",
  DINNER: "Bar Palladio",
  DRIVE: "Nahargarh sunset drive",
  MARKET: "Bapu Bazaar",
  WALK: "Patrika Gate"
};

function cleanText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = xss(value, {
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"]
  }).trim();

  return cleaned || undefined;
}

function canonicalPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

function asNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value.toString());
}

function distanceKm(
  left: { latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null },
  right: { latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null }
): number | null {
  const latA = asNumber(left.latitude);
  const lonA = asNumber(left.longitude);
  const latB = asNumber(right.latitude);
  const lonB = asNumber(right.longitude);

  if (latA === null || lonA === null || latB === null || lonB === null) {
    return null;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(latB - latA);
  const deltaLon = toRad(lonB - lonA);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(deltaLon / 2) ** 2;

  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

function matchesBasicPreferences(
  currentUser: InstantDateUser,
  candidate: InstantDateUser
): boolean {
  if (
    candidate.gender &&
    currentUser.interestedIn.length > 0 &&
    !currentUser.interestedIn.includes(candidate.gender)
  ) {
    return false;
  }

  if (
    currentUser.gender &&
    candidate.interestedIn.length > 0 &&
    !candidate.interestedIn.includes(currentUser.gender)
  ) {
    return false;
  }

  return true;
}

function overlapScore(left: string[], right: string[], points: number, max: number): number {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));
  const matches = left.filter((value) => rightSet.has(value.toLowerCase())).length;

  return Math.min(matches * points, max);
}

function interestNames(user: InstantDateUser): string[] {
  return user.interests.map(({ interest }) => interest.name);
}

function compatibilityScore(currentUser: InstantDateUser, candidate: InstantDateUser): number {
  let score = 42;

  score += overlapScore(interestNames(currentUser), interestNames(candidate), 6, 24);
  score += overlapScore(currentUser.music, candidate.music, 3, 9);
  score += overlapScore(currentUser.food, candidate.food, 2, 6);
  score += overlapScore(currentUser.travel, candidate.travel, 2, 6);

  if (currentUser.relationshipGoal && currentUser.relationshipGoal === candidate.relationshipGoal) {
    score += 10;
  }

  if (
    currentUser.city &&
    candidate.city &&
    currentUser.city.toLowerCase() === candidate.city.toLowerCase()
  ) {
    score += 8;
  }

  const distance = distanceKm(currentUser, candidate);

  if (distance !== null && distance <= 8) {
    score += 8;
  } else if (distance !== null && distance <= 25) {
    score += 4;
  }

  return Math.max(1, Math.min(score, 99));
}

function referenceLocation(
  user: InstantDateUser,
  input: {
    latitude?: number;
    longitude?: number;
  }
) {
  return {
    latitude:
      input.latitude === undefined ? user.latitude : new Prisma.Decimal(input.latitude.toFixed(6)),
    longitude:
      input.longitude === undefined
        ? user.longitude
        : new Prisma.Decimal(input.longitude.toFixed(6))
  };
}

function resolveProposedAt(input: InstantDateCreateInput | InstantDateRescheduleInput): Date {
  if (input.proposedAt) {
    return input.proposedAt;
  }

  const now = new Date();
  const timeWindow = input.timeWindow ?? "now";

  if (timeWindow === "now") {
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  if (timeWindow === "tonight") {
    const tonight = new Date(now);

    tonight.setHours(19, 0, 0, 0);

    if (tonight <= now) {
      tonight.setDate(tonight.getDate() + 1);
    }

    return tonight;
  }

  const weekend = new Date(now);
  const day = weekend.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;

  weekend.setDate(weekend.getDate() + daysUntilSaturday);
  weekend.setHours(17, 0, 0, 0);

  return weekend;
}

async function loadUser(userId: string): Promise<InstantDateUser> {
  const user = await prisma.user.findUnique({
    include: userInclude,
    where: {
      id: userId
    }
  });

  if (!user || user.deletedAt || user.isBanned) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  return user;
}

async function excludedUserIds(userId: string): Promise<Set<string>> {
  const [blocksMade, blocksReceived] = await Promise.all([
    prisma.block.findMany({
      select: {
        blockedUserId: true
      },
      where: {
        blockerId: userId
      }
    }),
    prisma.block.findMany({
      select: {
        blockerId: true
      },
      where: {
        blockedUserId: userId
      }
    })
  ]);

  return new Set([
    userId,
    ...blocksMade.map((block) => block.blockedUserId),
    ...blocksReceived.map((block) => block.blockerId)
  ]);
}

async function findRecipient(
  user: InstantDateUser,
  input: InstantDateCreateInput
): Promise<InstantDateUser | null> {
  const excluded = await excludedUserIds(user.id);
  const location = referenceLocation(user, input);
  const openRequests = await prisma.instantDate.findMany({
    include: {
      requester: {
        include: userInclude
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    take: 30,
    where: {
      activity: input.activity,
      proposedAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000)
      },
      recipientId: null,
      requesterId: {
        notIn: [...excluded]
      },
      status: InstantDateStatus.PENDING
    }
  });
  const openRequestCandidate = openRequests
    .map((request) => request.requester)
    .filter((candidate) => matchesBasicPreferences(user, candidate))
    .filter((candidate) => {
      const distance = distanceKm(location, candidate);

      return distance === null || distance <= 35;
    })
    .sort((left, right) => compatibilityScore(user, right) - compatibilityScore(user, left))[0];

  if (openRequestCandidate) {
    return openRequestCandidate;
  }

  const candidates = await prisma.user.findMany({
    include: userInclude,
    orderBy: [{ profileCompletion: "desc" }, { createdAt: "desc" }],
    take: 75,
    where: {
      deletedAt: null,
      id: {
        notIn: [...excluded]
      },
      isBanned: false,
      profileCompletion: {
        gte: 70
      },
      role: "USER",
      settings: {
        is: {
          discoverable: true
        }
      }
    }
  });

  return (
    candidates
      .filter((candidate) => matchesBasicPreferences(user, candidate))
      .filter((candidate) => {
        const distance = distanceKm(location, candidate);

        return distance === null || distance <= 35;
      })
      .sort((left, right) => compatibilityScore(user, right) - compatibilityScore(user, left))[0] ??
    null
  );
}

function serializeProfile(currentUser: InstantDateUser, profile: InstantDateUser | null) {
  if (!profile) {
    return null;
  }

  return {
    age: profile.age,
    city: profile.city,
    compatibilityScore: compatibilityScore(currentUser, profile),
    distanceKm: profile.settings?.showDistance === false ? null : distanceKm(currentUser, profile),
    id: profile.id,
    name: profile.name,
    photos: profile.photos.map((photo) => ({
      id: photo.id,
      isPrimary: photo.isPrimary,
      status: photo.status,
      url: photo.url
    })),
    profession: profile.profession,
    verificationStatus: profile.verificationStatus
  };
}

async function chatMatchIdFor(leftUserId: string, rightUserId: string): Promise<string | null> {
  const [userOneId, userTwoId] = canonicalPair(leftUserId, rightUserId);
  const match = await prisma.match.findUnique({
    select: {
      id: true,
      status: true
    },
    where: {
      userOneId_userTwoId: {
        userOneId,
        userTwoId
      }
    }
  });

  return match?.status === MatchStatus.ACTIVE ? match.id : null;
}

async function serializeInstantDate(
  userId: string,
  user: InstantDateUser,
  instantDate: InstantDateRecord
) {
  const other = instantDate.requesterId === userId ? instantDate.recipient : instantDate.requester;
  const chatMatchId =
    instantDate.status === InstantDateStatus.ACCEPTED && instantDate.recipientId
      ? await chatMatchIdFor(instantDate.requesterId, instantDate.recipientId)
      : null;

  return {
    activity: instantDate.activity,
    canAccept: instantDate.recipientId === userId && pendingStatuses.includes(instantDate.status),
    canCancel:
      [instantDate.requesterId, instantDate.recipientId].includes(userId) &&
      activeStatuses.includes(instantDate.status),
    canReject: instantDate.recipientId === userId && pendingStatuses.includes(instantDate.status),
    canReschedule:
      [instantDate.requesterId, instantDate.recipientId].includes(userId) &&
      activeStatuses.includes(instantDate.status),
    chatMatchId,
    createdAt: instantDate.createdAt.toISOString(),
    direction:
      instantDate.requesterId === userId
        ? "outgoing"
        : instantDate.recipientId === userId
          ? "incoming"
          : "open",
    id: instantDate.id,
    latitude: asNumber(instantDate.latitude),
    longitude: asNumber(instantDate.longitude),
    participant: serializeProfile(user, other),
    proposedAt: instantDate.proposedAt.toISOString(),
    requesterId: instantDate.requesterId,
    recipientId: instantDate.recipientId,
    status: instantDate.status,
    timeWindow: instantDate.timeWindow,
    updatedAt: instantDate.updatedAt.toISOString(),
    venue: instantDate.venue
  };
}

async function loadInstantDateForParticipant(
  userId: string,
  instantDateId: string
): Promise<InstantDateRecord> {
  const instantDate = await prisma.instantDate.findFirst({
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    where: {
      id: instantDateId,
      OR: [{ requesterId: userId }, { recipientId: userId }]
    }
  });

  if (!instantDate) {
    throw new HttpError(404, "INSTANT_DATE_NOT_FOUND", "Instant Date not found");
  }

  return instantDate;
}

async function notify(
  userId: string | null | undefined,
  title: string,
  body: string,
  instantDateId: string
) {
  if (!userId) {
    return;
  }

  await prisma.notification.create({
    data: {
      body,
      channel: NotificationChannel.IN_APP,
      data: {
        instantDateId
      },
      title,
      type: NotificationType.INSTANT_DATE_REQUEST,
      userId
    }
  });
}

export async function createInstantDate(userId: string, input: InstantDateCreateInput) {
  const user = await loadUser(userId);
  const recipient = await findRecipient(user, input);
  const location = referenceLocation(user, input);
  const proposedAt = resolveProposedAt(input);
  const venue = cleanText(input.venue) ?? activityVenues[input.activity];
  const instantDate = await prisma.instantDate.create({
    data: {
      activity: input.activity,
      latitude: location.latitude,
      longitude: location.longitude,
      proposedAt,
      recipientId: recipient?.id,
      requesterId: userId,
      timeWindow: input.timeWindow,
      venue
    },
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    }
  });

  await notify(
    recipient?.id,
    "Instant Date request",
    `${user.name ?? "Someone"} is up for ${input.activity.toLowerCase().replaceAll("_", " ")}.`,
    instantDate.id
  );

  return {
    instantDate: await serializeInstantDate(userId, user, instantDate)
  };
}

export async function listInstantDates(userId: string, query: InstantDateQuery) {
  const user = await loadUser(userId);
  const statusWhere: Prisma.InstantDateWhereInput =
    query.status === "history"
      ? {
          status: {
            in: [
              InstantDateStatus.CANCELLED,
              InstantDateStatus.COMPLETED,
              InstantDateStatus.REJECTED
            ]
          }
        }
      : query.status === "accepted"
        ? {
            status: InstantDateStatus.ACCEPTED
          }
        : query.status === "pending"
          ? {
              status: {
                in: [InstantDateStatus.PENDING, InstantDateStatus.RESCHEDULED]
              }
            }
          : {
              status: {
                in: activeStatuses
              }
            };
  const instantDates = await prisma.instantDate.findMany({
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    orderBy: [{ proposedAt: "asc" }, { createdAt: "desc" }],
    where: {
      ...statusWhere,
      OR: [{ requesterId: userId }, { recipientId: userId }]
    }
  });

  return {
    instantDates: await Promise.all(
      instantDates.map((instantDate) => serializeInstantDate(userId, user, instantDate))
    )
  };
}

export async function acceptInstantDate(userId: string, instantDateId: string) {
  const user = await loadUser(userId);
  const instantDate = await loadInstantDateForParticipant(userId, instantDateId);

  if (instantDate.recipientId !== userId) {
    throw new HttpError(403, "INSTANT_DATE_FORBIDDEN", "Only the invited user can accept");
  }

  if (!pendingStatuses.includes(instantDate.status)) {
    throw new HttpError(409, "INSTANT_DATE_NOT_ACTIONABLE", "This Instant Date cannot be accepted");
  }

  const [userOneId, userTwoId] = canonicalPair(instantDate.requesterId, userId);
  const score = compatibilityScore(instantDate.requester, user);
  const updated = await prisma.$transaction(async (client) => {
    const accepted = await client.instantDate.update({
      data: {
        status: InstantDateStatus.ACCEPTED
      },
      include: {
        recipient: {
          include: userInclude
        },
        requester: {
          include: userInclude
        }
      },
      where: {
        id: instantDateId
      }
    });

    await client.match.upsert({
      create: {
        compatibilityScore: score,
        userOneId,
        userTwoId
      },
      update: {
        compatibilityScore: score,
        status: MatchStatus.ACTIVE,
        unmatchedAt: null
      },
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId
        }
      }
    });

    return accepted;
  });

  await notify(
    instantDate.requesterId,
    "Instant Date accepted",
    `${user.name ?? "Your match"} accepted your plan.`,
    instantDateId
  );

  return {
    instantDate: await serializeInstantDate(userId, user, updated)
  };
}

export async function rejectInstantDate(userId: string, instantDateId: string) {
  const user = await loadUser(userId);
  const instantDate = await loadInstantDateForParticipant(userId, instantDateId);

  if (instantDate.recipientId !== userId) {
    throw new HttpError(403, "INSTANT_DATE_FORBIDDEN", "Only the invited user can reject");
  }

  if (!pendingStatuses.includes(instantDate.status)) {
    throw new HttpError(409, "INSTANT_DATE_NOT_ACTIONABLE", "This Instant Date cannot be rejected");
  }

  const updated = await prisma.instantDate.update({
    data: {
      status: InstantDateStatus.REJECTED
    },
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    where: {
      id: instantDateId
    }
  });

  await notify(
    instantDate.requesterId,
    "Instant Date declined",
    `${user.name ?? "Your match"} declined the plan.`,
    instantDateId
  );

  return {
    instantDate: await serializeInstantDate(userId, user, updated)
  };
}

export async function cancelInstantDate(userId: string, instantDateId: string) {
  const user = await loadUser(userId);
  const instantDate = await loadInstantDateForParticipant(userId, instantDateId);

  if (!activeStatuses.includes(instantDate.status)) {
    throw new HttpError(
      409,
      "INSTANT_DATE_NOT_ACTIONABLE",
      "This Instant Date cannot be cancelled"
    );
  }

  const updated = await prisma.instantDate.update({
    data: {
      status: InstantDateStatus.CANCELLED
    },
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    where: {
      id: instantDateId
    }
  });
  const otherUserId =
    instantDate.requesterId === userId ? instantDate.recipientId : instantDate.requesterId;

  await notify(otherUserId, "Instant Date cancelled", "The plan was cancelled.", instantDateId);

  return {
    instantDate: await serializeInstantDate(userId, user, updated)
  };
}

export async function rescheduleInstantDate(
  userId: string,
  instantDateId: string,
  input: InstantDateRescheduleInput
) {
  const user = await loadUser(userId);
  const instantDate = await loadInstantDateForParticipant(userId, instantDateId);

  if (!activeStatuses.includes(instantDate.status)) {
    throw new HttpError(
      409,
      "INSTANT_DATE_NOT_ACTIONABLE",
      "This Instant Date cannot be rescheduled"
    );
  }

  const location =
    input.latitude !== undefined && input.longitude !== undefined
      ? referenceLocation(user, input)
      : null;
  const updated = await prisma.instantDate.update({
    data: {
      latitude: location?.latitude,
      longitude: location?.longitude,
      proposedAt:
        input.proposedAt || input.timeWindow ? resolveProposedAt(input) : instantDate.proposedAt,
      status: InstantDateStatus.RESCHEDULED,
      timeWindow: input.timeWindow,
      venue: cleanText(input.venue)
    },
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    where: {
      id: instantDateId
    }
  });
  const otherUserId =
    instantDate.requesterId === userId ? instantDate.recipientId : instantDate.requesterId;

  await notify(
    otherUserId,
    "Instant Date rescheduled",
    "Your plan has a new proposed time.",
    instantDateId
  );

  return {
    instantDate: await serializeInstantDate(userId, user, updated)
  };
}

export async function shareInstantDateLocation(
  userId: string,
  instantDateId: string,
  input: LiveLocationInput
) {
  const user = await loadUser(userId);
  const instantDate = await loadInstantDateForParticipant(userId, instantDateId);

  if (!activeStatuses.includes(instantDate.status)) {
    throw new HttpError(
      409,
      "INSTANT_DATE_NOT_ACTIONABLE",
      "Location can be shared only for active plans"
    );
  }

  const location = referenceLocation(user, input);
  const updated = await prisma.instantDate.update({
    data: {
      latitude: location.latitude,
      longitude: location.longitude
    },
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    where: {
      id: instantDateId
    }
  });

  return {
    instantDate: await serializeInstantDate(userId, user, updated)
  };
}

export async function completeInstantDate(userId: string, instantDateId: string) {
  const user = await loadUser(userId);
  const instantDate = await loadInstantDateForParticipant(userId, instantDateId);

  if (instantDate.status !== InstantDateStatus.ACCEPTED) {
    throw new HttpError(409, "INSTANT_DATE_NOT_ACTIONABLE", "Only accepted plans can be completed");
  }

  const updated = await prisma.instantDate.update({
    data: {
      status: InstantDateStatus.COMPLETED
    },
    include: {
      recipient: {
        include: userInclude
      },
      requester: {
        include: userInclude
      }
    },
    where: {
      id: instantDateId
    }
  });

  return {
    instantDate: await serializeInstantDate(userId, user, updated)
  };
}
