import {
  AuditAction,
  LikeType,
  MatchStatus,
  NotificationChannel,
  NotificationType,
  type Interest,
  type Match,
  type Message,
  type Photo,
  type Prisma,
  type Settings,
  type User,
  type UserInterest
} from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import type {
  LikeActionInput,
  MatchActionInput,
  MatchingFiltersInput,
  RecommendationQuery
} from "./matching.schemas.js";

type CandidateUser = User & {
  interests: Array<UserInterest & { interest: Interest }>;
  photos: Photo[];
  settings: Settings | null;
};

type MatchRecord = {
  compatibilityScore: number;
  id: string;
  matchedAt: Date;
  messages: Message[];
  status: MatchStatus;
  userOne: CandidateUser;
  userOneId: string;
  userTwo: CandidateUser;
  userTwoId: string;
};

const publicProfileInclude = {
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

function canonicalPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

function asNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value.toString());
}

function distanceKm(a: CandidateUser, b: CandidateUser): number | null {
  const latA = asNumber(a.latitude);
  const lonA = asNumber(a.longitude);
  const latB = asNumber(b.latitude);
  const lonB = asNumber(b.longitude);

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

function setIntersectionScore(
  left: string[],
  right: string[],
  pointsPerMatch: number,
  max: number
): number {
  const rightSet = new Set(right.map((value) => value.toLowerCase()));
  const matches = left.filter((value) => rightSet.has(value.toLowerCase())).length;

  return Math.min(matches * pointsPerMatch, max);
}

function interestNames(user: CandidateUser): string[] {
  return user.interests.map(({ interest }) => interest.name);
}

function calculateCompatibility(currentUser: CandidateUser, candidate: CandidateUser): number {
  let score = 40;

  score += setIntersectionScore(interestNames(currentUser), interestNames(candidate), 6, 24);
  score += setIntersectionScore(currentUser.music, candidate.music, 3, 9);
  score += setIntersectionScore(currentUser.food, candidate.food, 2, 6);
  score += setIntersectionScore(currentUser.travel, candidate.travel, 2, 6);
  score += setIntersectionScore(currentUser.languages, candidate.languages, 2, 6);

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

  if (candidate.verificationStatus !== "UNVERIFIED") {
    score += 5;
  }

  if (candidate.profileCompletion >= 90) {
    score += 4;
  }

  const distance = distanceKm(currentUser, candidate);

  if (distance !== null && distance <= 10) {
    score += 5;
  } else if (distance !== null && distance <= 35) {
    score += 3;
  }

  return Math.max(1, Math.min(score, 99));
}

function serializePublicProfile(currentUser: CandidateUser, candidate: CandidateUser) {
  const distance = distanceKm(currentUser, candidate);

  return {
    age: candidate.age,
    bio: candidate.bio,
    city: candidate.city,
    compatibilityScore: calculateCompatibility(currentUser, candidate),
    distanceKm: candidate.settings?.showDistance === false ? null : distance,
    gender: candidate.gender,
    id: candidate.id,
    interests: candidate.interests
      .map(({ interest }) => ({
        category: interest.category,
        id: interest.id,
        name: interest.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    name: candidate.name,
    photos: candidate.photos.map((photo) => ({
      id: photo.id,
      isPrimary: photo.isPrimary,
      status: photo.status,
      url: photo.url
    })),
    profession: candidate.profession,
    relationshipGoal: candidate.relationshipGoal,
    verificationStatus: candidate.verificationStatus
  };
}

function serializeMatch(currentUserId: string, match: MatchRecord) {
  const otherUser = match.userOneId === currentUserId ? match.userTwo : match.userOne;
  const currentUser = match.userOneId === currentUserId ? match.userOne : match.userTwo;
  const latestMessage = match.messages[0];

  return {
    compatibilityScore: match.compatibilityScore,
    id: match.id,
    latestMessage: latestMessage
      ? {
          body: latestMessage.body,
          createdAt: latestMessage.createdAt.toISOString(),
          senderId: latestMessage.senderId,
          status: latestMessage.status,
          type: latestMessage.type
        }
      : null,
    matchedAt: match.matchedAt.toISOString(),
    profile: serializePublicProfile(currentUser, otherUser),
    status: match.status
  };
}

function matchesBasicPreferences(currentUser: CandidateUser, candidate: CandidateUser): boolean {
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

function matchesQueryFilters(
  currentUser: CandidateUser,
  candidate: CandidateUser,
  query: RecommendationQuery
): boolean {
  const minAge = query.ageMin ?? currentUser.settings?.minAge ?? 18;
  const maxAge = query.ageMax ?? currentUser.settings?.maxAge ?? 80;
  const maxDistanceKm = query.maxDistanceKm ?? currentUser.settings?.maxDistanceKm;

  if (candidate.age !== null && (candidate.age < minAge || candidate.age > maxAge)) {
    return false;
  }

  if (query.gender && candidate.gender !== query.gender) {
    return false;
  }

  if (query.relationshipGoal && candidate.relationshipGoal !== query.relationshipGoal) {
    return false;
  }

  if (query.religion && candidate.religion?.toLowerCase() !== query.religion.toLowerCase()) {
    return false;
  }

  if (
    query.profession &&
    !candidate.profession?.toLowerCase().includes(query.profession.toLowerCase())
  ) {
    return false;
  }

  if (
    query.interest &&
    !candidate.interests.some(({ interest }) =>
      interest.name.toLowerCase().includes(query.interest!.toLowerCase())
    )
  ) {
    return false;
  }

  if (
    query.lifestyle &&
    !JSON.stringify(candidate.lifestyle ?? {})
      .toLowerCase()
      .includes(query.lifestyle.toLowerCase())
  ) {
    return false;
  }

  const distance = distanceKm(currentUser, candidate);

  if (maxDistanceKm && distance !== null && distance > maxDistanceKm) {
    return false;
  }

  return true;
}

async function loadCurrentUser(userId: string): Promise<CandidateUser> {
  const user = await prisma.user.findUnique({
    include: publicProfileInclude,
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
  const [likes, passes, blocksMade, blocksReceived, matches] = await Promise.all([
    prisma.like.findMany({
      select: {
        toUserId: true
      },
      where: {
        fromUserId: userId
      }
    }),
    prisma.pass.findMany({
      select: {
        toUserId: true
      },
      where: {
        fromUserId: userId
      }
    }),
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
    }),
    prisma.match.findMany({
      select: {
        userOneId: true,
        userTwoId: true
      },
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
        status: MatchStatus.ACTIVE
      }
    })
  ]);

  return new Set([
    userId,
    ...likes.map((like) => like.toUserId),
    ...passes.map((pass) => pass.toUserId),
    ...blocksMade.map((block) => block.blockedUserId),
    ...blocksReceived.map((block) => block.blockerId),
    ...matches.map((match) => (match.userOneId === userId ? match.userTwoId : match.userOneId))
  ]);
}

export async function getRecommendations(userId: string, query: RecommendationQuery) {
  const currentUser = await loadCurrentUser(userId);
  const excluded = await excludedUserIds(userId);
  const candidates = await prisma.user.findMany({
    include: publicProfileInclude,
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

  const recommendations = candidates
    .filter((candidate) => matchesBasicPreferences(currentUser, candidate))
    .filter((candidate) => matchesQueryFilters(currentUser, candidate, query))
    .map((candidate) => serializePublicProfile(currentUser, candidate))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, query.limit);

  return {
    recommendations
  };
}

export async function likeUser(userId: string, input: LikeActionInput) {
  if (userId === input.targetUserId) {
    throw new HttpError(400, "INVALID_MATCH_ACTION", "You cannot like yourself");
  }

  const [currentUser, targetUser] = await Promise.all([
    loadCurrentUser(userId),
    prisma.user.findUnique({
      include: publicProfileInclude,
      where: {
        id: input.targetUserId
      }
    })
  ]);

  if (!targetUser || targetUser.deletedAt || targetUser.isBanned) {
    throw new HttpError(404, "PROFILE_NOT_FOUND", "Profile not found");
  }

  const reciprocalLike = await prisma.like.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: input.targetUserId,
        toUserId: userId
      }
    }
  });
  const score = calculateCompatibility(currentUser, targetUser);

  const createdMatch: Match | null = await prisma.$transaction(async (client) => {
    await client.pass.deleteMany({
      where: {
        fromUserId: userId,
        toUserId: input.targetUserId
      }
    });

    await client.like.upsert({
      create: {
        fromUserId: userId,
        toUserId: input.targetUserId,
        type: input.type
      },
      update: {
        type: input.type
      },
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: input.targetUserId
        }
      }
    });

    await client.auditLog.create({
      data: {
        action: AuditAction.LIKE_CREATED,
        actorId: userId,
        entity: "Like",
        entityId: input.targetUserId,
        metadata: {
          type: input.type
        }
      }
    });

    if (reciprocalLike) {
      const [userOneId, userTwoId] = canonicalPair(userId, input.targetUserId);
      const match = await client.match.upsert({
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

      await client.notification.createMany({
        data: [
          {
            body: "You both vibed. Start the conversation when it feels right.",
            channel: NotificationChannel.IN_APP,
            data: {
              matchId: match.id
            },
            title: "It's a MatchA",
            type: NotificationType.MATCH,
            userId
          },
          {
            body: "You both vibed. Start the conversation when it feels right.",
            channel: NotificationChannel.IN_APP,
            data: {
              matchId: match.id
            },
            title: "It's a MatchA",
            type: NotificationType.MATCH,
            userId: input.targetUserId
          }
        ]
      });

      await client.auditLog.create({
        data: {
          action: AuditAction.MATCH_CREATED,
          actorId: userId,
          entity: "Match",
          entityId: match.id,
          metadata: {
            targetUserId: input.targetUserId
          }
        }
      });

      return match;
    } else {
      await client.notification.create({
        data: {
          body:
            input.type === LikeType.SUPER_LIKE
              ? "Someone sent you main rizz."
              : "Someone liked your vibe.",
          channel: NotificationChannel.IN_APP,
          data: {
            fromUserId: userId
          },
          title: input.type === LikeType.SUPER_LIKE ? "Super like" : "New like",
          type: NotificationType.LIKE,
          userId: input.targetUserId
        }
      });
    }

    return null;
  });

  return {
    action: input.type,
    match: createdMatch
      ? {
          compatibilityScore: score,
          id: createdMatch.id,
          matchedAt: createdMatch.matchedAt.toISOString(),
          profile: serializePublicProfile(currentUser, targetUser)
        }
      : null,
    targetUserId: input.targetUserId
  };
}

export async function passUser(userId: string, input: MatchActionInput) {
  if (userId === input.targetUserId) {
    throw new HttpError(400, "INVALID_MATCH_ACTION", "You cannot pass yourself");
  }

  await prisma.$transaction(async (client) => {
    await client.like.deleteMany({
      where: {
        fromUserId: userId,
        toUserId: input.targetUserId
      }
    });

    await client.pass.upsert({
      create: {
        fromUserId: userId,
        toUserId: input.targetUserId
      },
      update: {},
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: input.targetUserId
        }
      }
    });
  });

  return {
    action: "PASS",
    targetUserId: input.targetUserId
  };
}

export async function undoLastAction(userId: string) {
  const [latestLike, latestPass] = await Promise.all([
    prisma.like.findFirst({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        fromUserId: userId
      }
    }),
    prisma.pass.findFirst({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        fromUserId: userId
      }
    })
  ]);

  if (!latestLike && !latestPass) {
    throw new HttpError(404, "NOTHING_TO_UNDO", "No recent matching action to undo");
  }

  if (latestLike && (!latestPass || latestLike.createdAt >= latestPass.createdAt)) {
    const [userOneId, userTwoId] = canonicalPair(userId, latestLike.toUserId);

    await prisma.$transaction([
      prisma.like.delete({
        where: {
          id: latestLike.id
        }
      }),
      prisma.match.updateMany({
        data: {
          status: MatchStatus.UNMATCHED,
          unmatchedAt: new Date()
        },
        where: {
          userOneId,
          userTwoId,
          status: MatchStatus.ACTIVE
        }
      })
    ]);

    return {
      action: "UNDO_LIKE",
      targetUserId: latestLike.toUserId
    };
  }

  await prisma.pass.delete({
    where: {
      id: latestPass!.id
    }
  });

  return {
    action: "UNDO_PASS",
    targetUserId: latestPass!.toUserId
  };
}

export async function getMatches(userId: string) {
  const matches = (await prisma.match.findMany({
    include: {
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      },
      userOne: {
        include: publicProfileInclude
      },
      userTwo: {
        include: publicProfileInclude
      }
    },
    orderBy: {
      matchedAt: "desc"
    },
    where: {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
      status: MatchStatus.ACTIVE
    }
  })) as MatchRecord[];

  return {
    matches: matches.map((match) => serializeMatch(userId, match))
  };
}

export async function getMatchingFilters(userId: string) {
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
    filters: {
      maxAge: settings.maxAge,
      maxDistanceKm: settings.maxDistanceKm,
      minAge: settings.minAge,
      showDistance: settings.showDistance
    }
  };
}

export async function updateMatchingFilters(userId: string, input: MatchingFiltersInput) {
  const settings = await prisma.settings.upsert({
    create: {
      ...input,
      userId
    },
    update: input,
    where: {
      userId
    }
  });

  return {
    filters: {
      maxAge: settings.maxAge,
      maxDistanceKm: settings.maxDistanceKm,
      minAge: settings.minAge,
      showDistance: settings.showDistance
    }
  };
}
