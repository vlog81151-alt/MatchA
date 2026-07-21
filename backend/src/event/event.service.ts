import {
  NotificationChannel,
  NotificationType,
  ParticipantStatus,
  type Event,
  type EventParticipant,
  type Photo,
  type Prisma,
  type User
} from "@prisma/client";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import type { EventInviteInput, EventParticipationInput, EventQuery } from "./event.schemas.js";

type EventUser = Pick<
  User,
  "age" | "city" | "id" | "name" | "profession" | "verificationStatus"
> & {
  photos: Photo[];
};

type EventParticipantRecord = EventParticipant & {
  user: EventUser;
};

type EventRecord = Event & {
  participants: EventParticipantRecord[];
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

const eventInclude = {
  participants: {
    include: {
      user: {
        select: participantUserSelect
      }
    },
    orderBy: [{ status: "desc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.EventInclude;

function serializeProfile(user: EventUser) {
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

function serializeParticipant(participant: EventParticipantRecord) {
  return {
    createdAt: participant.createdAt.toISOString(),
    profile: serializeProfile(participant.user),
    status: participant.status,
    userId: participant.userId
  };
}

function serializeEvent(event: EventRecord, userId: string) {
  const activeParticipants = event.participants.filter(
    (participant) => participant.status !== ParticipantStatus.CANCELLED
  );
  const currentUserParticipant =
    event.participants.find((participant) => participant.userId === userId) ?? null;
  const statusCounts = activeParticipants.reduce<Record<string, number>>((counts, participant) => {
    counts[participant.status] = (counts[participant.status] ?? 0) + 1;

    return counts;
  }, {});

  return {
    attendeeCount: activeParticipants.length,
    category: event.category,
    city: event.city,
    coverImage: event.coverImage,
    createdAt: event.createdAt.toISOString(),
    currentUserParticipation: currentUserParticipant
      ? {
          createdAt: currentUserParticipant.createdAt.toISOString(),
          status: currentUserParticipant.status
        }
      : null,
    description: event.description,
    endsAt: event.endsAt?.toISOString() ?? null,
    id: event.id,
    isPublished: event.isPublished,
    participantPreview: activeParticipants.slice(0, 5).map(serializeParticipant),
    startsAt: event.startsAt.toISOString(),
    statusCounts,
    title: event.title,
    updatedAt: event.updatedAt.toISOString(),
    venue: event.venue
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

async function loadEvent(eventId: string): Promise<EventRecord> {
  const event = await prisma.event.findFirst({
    include: eventInclude,
    where: {
      id: eventId,
      isPublished: true
    }
  });

  if (!event) {
    throw new HttpError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  return event;
}

function ensureEventOpen(event: EventRecord): void {
  const closeAt = event.endsAt ?? event.startsAt;

  if (closeAt < new Date()) {
    throw new HttpError(409, "EVENT_CLOSED", "This event has already ended");
  }
}

async function ensureNotBlocked(actorId: string, recipientId: string): Promise<void> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        {
          blockedUserId: recipientId,
          blockerId: actorId
        },
        {
          blockedUserId: actorId,
          blockerId: recipientId
        }
      ]
    }
  });

  if (block) {
    throw new HttpError(403, "INVITE_BLOCKED", "This invite is not available");
  }
}

async function notifyEventParticipants({
  actorName,
  event,
  status,
  userId
}: {
  actorName: string | null;
  event: EventRecord;
  status: ParticipantStatus;
  userId: string;
}) {
  const recipients = event.participants
    .filter((participant) => participant.userId !== userId)
    .filter((participant) => participant.status !== ParticipantStatus.CANCELLED)
    .map((participant) => participant.userId);

  if (recipients.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: recipients.map((recipientId) => ({
      body: `${actorName ?? "Someone"} is ${status === ParticipantStatus.JOINED ? "going to" : "interested in"} ${event.title}.`,
      channel: NotificationChannel.IN_APP,
      data: {
        eventId: event.id,
        status
      },
      title: "Event update",
      type: NotificationType.SYSTEM,
      userId: recipientId
    }))
  });
}

export async function listEvents(userId: string, query: EventQuery) {
  await ensureUser(userId);

  const where: Prisma.EventWhereInput = {
    isPublished: true,
    startsAt: {
      gte: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  };

  if (query.category) {
    where.category = query.category;
  }

  if (query.city) {
    where.city = {
      contains: query.city,
      mode: "insensitive"
    };
  }

  if (query.q) {
    where.OR = [
      {
        description: {
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

  const events = (await prisma.event.findMany({
    include: eventInclude,
    orderBy: {
      startsAt: "asc"
    },
    take: query.limit,
    where
  })) as EventRecord[];

  return {
    events: events.map((event) => serializeEvent(event, userId))
  };
}

export async function getEvent(userId: string, eventId: string) {
  await ensureUser(userId);
  const event = await loadEvent(eventId);

  return {
    event: serializeEvent(event, userId),
    participants: event.participants
      .filter((participant) => participant.status !== ParticipantStatus.CANCELLED)
      .map(serializeParticipant)
  };
}

export async function listMyEvents(userId: string) {
  await ensureUser(userId);
  const events = (await prisma.event.findMany({
    include: eventInclude,
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
  })) as EventRecord[];

  return {
    events: events.map((event) => serializeEvent(event, userId))
  };
}

export async function joinEvent(userId: string, eventId: string, input: EventParticipationInput) {
  const [user, event] = await Promise.all([ensureUser(userId), loadEvent(eventId)]);

  ensureEventOpen(event);

  const participant = await prisma.eventParticipant.upsert({
    create: {
      eventId,
      status: input.status,
      userId
    },
    update: {
      status: input.status
    },
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  });

  await notifyEventParticipants({
    actorName: user.name,
    event,
    status: input.status,
    userId
  });

  return {
    participant: {
      createdAt: participant.createdAt.toISOString(),
      eventId: participant.eventId,
      status: participant.status,
      userId: participant.userId
    }
  };
}

export async function cancelEventParticipation(userId: string, eventId: string) {
  await ensureUser(userId);
  await loadEvent(eventId);

  const existing = await prisma.eventParticipant.findUnique({
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  });

  if (!existing) {
    throw new HttpError(404, "EVENT_PARTICIPATION_NOT_FOUND", "Event participation not found");
  }

  const participant = await prisma.eventParticipant.update({
    data: {
      status: ParticipantStatus.CANCELLED
    },
    where: {
      eventId_userId: {
        eventId,
        userId
      }
    }
  });

  return {
    participant: {
      createdAt: participant.createdAt.toISOString(),
      eventId: participant.eventId,
      status: participant.status,
      userId: participant.userId
    }
  };
}

export async function inviteUserToEvent(userId: string, eventId: string, input: EventInviteInput) {
  if (input.recipientUserId === userId) {
    throw new HttpError(400, "INVITE_SELF", "Choose another member to invite");
  }

  const [actor, recipient, event] = await Promise.all([
    ensureUser(userId),
    prisma.user.findUnique({
      select: {
        deletedAt: true,
        id: true,
        isBanned: true,
        name: true
      },
      where: {
        id: input.recipientUserId
      }
    }),
    loadEvent(eventId)
  ]);

  if (!recipient || recipient.deletedAt || recipient.isBanned) {
    throw new HttpError(404, "INVITE_RECIPIENT_NOT_FOUND", "Invite recipient not found");
  }

  ensureEventOpen(event);
  await ensureNotBlocked(userId, input.recipientUserId);

  const notification = await prisma.notification.create({
    data: {
      body:
        input.message ??
        `${actor.name ?? "Someone"} invited you to join ${event.title} at ${event.venue}.`,
      channel: NotificationChannel.IN_APP,
      data: {
        eventId: event.id,
        inviterId: userId
      },
      title: "Event invite",
      type: NotificationType.SYSTEM,
      userId: input.recipientUserId
    }
  });

  return {
    invitation: {
      eventId,
      id: notification.id,
      recipientName: recipient.name,
      recipientUserId: input.recipientUserId,
      status: "sent"
    }
  };
}
