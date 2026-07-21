import {
  NotificationChannel,
  NotificationType,
  ParticipantStatus,
  type Concert,
  type ConcertParticipant,
  type Photo,
  type Prisma,
  type User
} from "@prisma/client";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  ConcertIntentUpdateInput,
  ConcertJoinInput,
  ConcertQuery
} from "./concert.schemas.js";

type ConcertUser = Pick<
  User,
  "age" | "city" | "id" | "name" | "profession" | "verificationStatus"
> & {
  photos: Photo[];
};

type ConcertParticipantRecord = ConcertParticipant & {
  user: ConcertUser;
};

type ConcertRecord = Concert & {
  participants: ConcertParticipantRecord[];
};

const participantUserSelect = {
  age: true,
  city: true,
  id: true,
  name: true,
  photos: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  },
  profession: true,
  verificationStatus: true
} satisfies Prisma.UserSelect;

const concertInclude = {
  participants: {
    include: {
      user: {
        select: participantUserSelect
      }
    },
    orderBy: [{ status: "desc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.ConcertInclude;

function serializeProfile(user: ConcertUser) {
  return {
    age: user.age,
    city: user.city,
    id: user.id,
    name: user.name,
    photos: user.photos.map((photo) => ({
      id: photo.id,
      isPrimary: photo.isPrimary,
      status: photo.status,
      url: photo.url
    })),
    profession: user.profession,
    verificationStatus: user.verificationStatus
  };
}

function serializeParticipant(participant: ConcertParticipantRecord) {
  return {
    createdAt: participant.createdAt.toISOString(),
    intent: participant.intent,
    profile: serializeProfile(participant.user),
    status: participant.status,
    userId: participant.userId
  };
}

function serializeConcert(concert: ConcertRecord, userId: string) {
  const activeParticipants = concert.participants.filter(
    (participant) => participant.status !== ParticipantStatus.CANCELLED
  );
  const currentUserParticipant =
    concert.participants.find((participant) => participant.userId === userId) ?? null;
  const intentCounts = activeParticipants.reduce<Record<string, number>>((counts, participant) => {
    counts[participant.intent] = (counts[participant.intent] ?? 0) + 1;

    return counts;
  }, {});

  return {
    artist: concert.artist,
    attendeeCount: activeParticipants.length,
    city: concert.city,
    coverImage: concert.coverImage,
    createdAt: concert.createdAt.toISOString(),
    currentUserParticipation: currentUserParticipant
      ? {
          createdAt: currentUserParticipant.createdAt.toISOString(),
          intent: currentUserParticipant.intent,
          status: currentUserParticipant.status
        }
      : null,
    genreTags: concert.genreTags,
    id: concert.id,
    intentCounts,
    isPublished: concert.isPublished,
    participantPreview: activeParticipants.slice(0, 4).map(serializeParticipant),
    startsAt: concert.startsAt.toISOString(),
    title: concert.title,
    updatedAt: concert.updatedAt.toISOString(),
    venue: concert.venue
  };
}

async function ensureUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user || user.deletedAt || user.isBanned) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  return user;
}

async function loadConcert(concertId: string): Promise<ConcertRecord> {
  const concert = await prisma.concert.findFirst({
    include: concertInclude,
    where: {
      id: concertId,
      isPublished: true
    }
  });

  if (!concert) {
    throw new HttpError(404, "CONCERT_NOT_FOUND", "Concert not found");
  }

  return concert;
}

async function notifyConcertParticipants({
  actorName,
  concert,
  intent,
  userId
}: {
  actorName: string | null;
  concert: ConcertRecord;
  intent: string;
  userId: string;
}) {
  const recipients = concert.participants
    .filter((participant) => participant.userId !== userId)
    .filter((participant) => participant.status !== ParticipantStatus.CANCELLED)
    .map((participant) => participant.userId);

  if (recipients.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: recipients.map((recipientId) => ({
      body: `${actorName ?? "Someone"} joined ${concert.title} for ${intent.replaceAll("_", " ")}.`,
      channel: NotificationChannel.IN_APP,
      data: {
        concertId: concert.id,
        intent
      },
      title: "Concert Mode",
      type: NotificationType.CONCERT_INVITATION,
      userId: recipientId
    }))
  });
}

export async function listConcerts(userId: string, query: ConcertQuery) {
  await ensureUser(userId);

  const where: Prisma.ConcertWhereInput = {
    isPublished: true,
    startsAt: {
      gte: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  };

  if (query.city) {
    where.city = {
      contains: query.city,
      mode: "insensitive"
    };
  }

  if (query.genre) {
    where.genreTags = {
      has: query.genre.toLowerCase()
    };
  }

  if (query.q) {
    where.OR = [
      {
        artist: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        title: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        venue: {
          contains: query.q,
          mode: "insensitive"
        }
      }
    ];
  }

  const concerts = (await prisma.concert.findMany({
    include: concertInclude,
    orderBy: {
      startsAt: "asc"
    },
    take: query.limit,
    where
  })) as ConcertRecord[];

  return {
    concerts: concerts.map((concert) => serializeConcert(concert, userId))
  };
}

export async function getConcert(userId: string, concertId: string) {
  await ensureUser(userId);
  const concert = await loadConcert(concertId);

  return {
    concert: serializeConcert(concert, userId),
    participants: concert.participants
      .filter((participant) => participant.status !== ParticipantStatus.CANCELLED)
      .map(serializeParticipant)
  };
}

export async function listMyConcerts(userId: string) {
  await ensureUser(userId);
  const concerts = (await prisma.concert.findMany({
    include: concertInclude,
    orderBy: {
      startsAt: "asc"
    },
    where: {
      isPublished: true,
      participants: {
        some: {
          status: {
            in: [ParticipantStatus.INTERESTED, ParticipantStatus.JOINED]
          },
          userId
        }
      }
    }
  })) as ConcertRecord[];

  return {
    concerts: concerts.map((concert) => serializeConcert(concert, userId))
  };
}

export async function joinConcert(userId: string, concertId: string, input: ConcertJoinInput) {
  const [user, concert] = await Promise.all([ensureUser(userId), loadConcert(concertId)]);

  if (concert.startsAt < new Date()) {
    throw new HttpError(409, "CONCERT_CLOSED", "This concert has already started");
  }

  const participant = await prisma.concertParticipant.upsert({
    create: {
      concertId,
      intent: input.intent,
      status: input.status,
      userId
    },
    update: {
      intent: input.intent,
      status: input.status
    },
    where: {
      concertId_userId: {
        concertId,
        userId
      }
    }
  });

  await notifyConcertParticipants({
    actorName: user.name,
    concert,
    intent: input.intent,
    userId
  });

  return {
    participant: {
      concertId: participant.concertId,
      createdAt: participant.createdAt.toISOString(),
      intent: participant.intent,
      status: participant.status,
      userId: participant.userId
    }
  };
}

export async function updateConcertIntent(
  userId: string,
  concertId: string,
  input: ConcertIntentUpdateInput
) {
  await ensureUser(userId);
  await loadConcert(concertId);
  const participant = await prisma.concertParticipant.update({
    data: {
      intent: input.intent
    },
    where: {
      concertId_userId: {
        concertId,
        userId
      }
    }
  });

  return {
    participant: {
      concertId: participant.concertId,
      createdAt: participant.createdAt.toISOString(),
      intent: participant.intent,
      status: participant.status,
      userId: participant.userId
    }
  };
}

export async function cancelConcertParticipation(userId: string, concertId: string) {
  await ensureUser(userId);
  await loadConcert(concertId);
  const participant = await prisma.concertParticipant.update({
    data: {
      status: ParticipantStatus.CANCELLED
    },
    where: {
      concertId_userId: {
        concertId,
        userId
      }
    }
  });

  return {
    participant: {
      concertId: participant.concertId,
      createdAt: participant.createdAt.toISOString(),
      intent: participant.intent,
      status: participant.status,
      userId: participant.userId
    }
  };
}

export async function confirmConcertMeetup(userId: string, concertId: string) {
  await ensureUser(userId);
  await loadConcert(concertId);
  const participant = await prisma.concertParticipant.update({
    data: {
      status: ParticipantStatus.JOINED
    },
    where: {
      concertId_userId: {
        concertId,
        userId
      }
    }
  });

  return {
    participant: {
      concertId: participant.concertId,
      createdAt: participant.createdAt.toISOString(),
      intent: participant.intent,
      status: participant.status,
      userId: participant.userId
    }
  };
}
