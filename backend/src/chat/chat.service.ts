import {
  AuditAction,
  MatchStatus,
  MessageStatus,
  MessageType,
  NotificationChannel,
  NotificationType,
  type ChatParticipantState,
  type Match,
  type Message,
  type Photo,
  type Prisma,
  type User
} from "@prisma/client";
import xss from "xss";

import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import type {
  ChatListQuery,
  ChatSettingsInput,
  EditMessageInput,
  MessageListQuery,
  ReportChatInput,
  SendMessageInput
} from "./chat.schemas.js";

type ChatUser = User & {
  photos: Photo[];
};

type ChatMatch = Match & {
  chatStates: ChatParticipantState[];
  messages: Message[];
  userOne: ChatUser;
  userTwo: ChatUser;
};

type ChatMessage = Message & {
  replyTo?: Message | null;
  sender: Pick<User, "id" | "name">;
};

const chatUserInclude = {
  photos: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.UserInclude;

function asJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}

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

function otherUserId(match: Pick<Match, "userOneId" | "userTwoId">, userId: string): string {
  return match.userOneId === userId ? match.userTwoId : match.userOneId;
}

function otherUser(match: ChatMatch, userId: string): ChatUser {
  return match.userOneId === userId ? match.userTwo : match.userOne;
}

function stateFor(match: ChatMatch, userId: string) {
  const state = match.chatStates.find((chatState) => chatState.userId === userId);

  return {
    archivedAt: state?.archivedAt?.toISOString() ?? null,
    lastDeliveredAt: state?.lastDeliveredAt?.toISOString() ?? null,
    lastReadAt: state?.lastReadAt?.toISOString() ?? null,
    mutedAt: state?.mutedAt?.toISOString() ?? null
  };
}

function serializePublicChatProfile(user: ChatUser) {
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

function serializeMessage(message: ChatMessage) {
  const deleted = Boolean(message.deletedAt);

  return {
    body: deleted ? null : message.body,
    createdAt: message.createdAt.toISOString(),
    deletedAt: message.deletedAt?.toISOString() ?? null,
    editedAt: message.editedAt?.toISOString() ?? null,
    id: message.id,
    matchId: message.matchId,
    mediaUrl: deleted ? null : message.mediaUrl,
    metadata: deleted ? null : message.metadata,
    replyTo: message.replyTo
      ? {
          body: message.replyTo.deletedAt ? null : message.replyTo.body,
          deletedAt: message.replyTo.deletedAt?.toISOString() ?? null,
          id: message.replyTo.id,
          senderId: message.replyTo.senderId,
          type: message.replyTo.type
        }
      : null,
    replyToId: message.replyToId,
    sender: {
      id: message.sender.id,
      name: message.sender.name
    },
    senderId: message.senderId,
    status: deleted ? MessageStatus.DELETED : message.status,
    type: message.type
  };
}

async function ensureState(client: Prisma.TransactionClient, matchId: string, userId: string) {
  return client.chatParticipantState.upsert({
    create: {
      matchId,
      userId
    },
    update: {},
    where: {
      matchId_userId: {
        matchId,
        userId
      }
    }
  });
}

export async function ensureActiveChatMatch(userId: string, matchId: string): Promise<ChatMatch> {
  const match = await prisma.match.findFirst({
    include: {
      chatStates: true,
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      },
      userOne: {
        include: chatUserInclude
      },
      userTwo: {
        include: chatUserInclude
      }
    },
    where: {
      id: matchId,
      OR: [{ userOneId: userId }, { userTwoId: userId }],
      status: MatchStatus.ACTIVE
    }
  });

  if (!match) {
    throw new HttpError(404, "CHAT_NOT_FOUND", "Active chat not found");
  }

  const peerId = otherUserId(match, userId);
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        {
          blockedUserId: peerId,
          blockerId: userId
        },
        {
          blockedUserId: userId,
          blockerId: peerId
        }
      ]
    }
  });

  if (block) {
    throw new HttpError(403, "CHAT_BLOCKED", "This chat is blocked");
  }

  return match;
}

function serializeChatSummary(match: ChatMatch, userId: string, unreadCount: number) {
  const latestMessage = match.messages[0];

  return {
    compatibilityScore: match.compatibilityScore,
    id: match.id,
    latestMessage: latestMessage
      ? {
          body: latestMessage.deletedAt ? null : latestMessage.body,
          createdAt: latestMessage.createdAt.toISOString(),
          deletedAt: latestMessage.deletedAt?.toISOString() ?? null,
          id: latestMessage.id,
          senderId: latestMessage.senderId,
          status: latestMessage.deletedAt ? MessageStatus.DELETED : latestMessage.status,
          type: latestMessage.type
        }
      : null,
    matchedAt: match.matchedAt.toISOString(),
    profile: serializePublicChatProfile(otherUser(match, userId)),
    settings: stateFor(match, userId),
    status: match.status,
    unreadCount
  };
}

export async function listChats(userId: string, query: ChatListQuery) {
  const matches = (await prisma.match.findMany({
    include: {
      chatStates: true,
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      },
      userOne: {
        include: chatUserInclude
      },
      userTwo: {
        include: chatUserInclude
      }
    },
    orderBy: {
      matchedAt: "desc"
    },
    where: {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
      status: MatchStatus.ACTIVE
    }
  })) as ChatMatch[];

  const visibleMatches = matches.filter((match) => {
    if (query.includeArchived) {
      return true;
    }

    return !match.chatStates.some((state) => state.userId === userId && state.archivedAt);
  });

  const chats = await Promise.all(
    visibleMatches.map(async (match) => {
      const unreadCount = await prisma.message.count({
        where: {
          deletedAt: null,
          matchId: match.id,
          senderId: {
            not: userId
          },
          status: {
            not: MessageStatus.READ
          }
        }
      });

      return serializeChatSummary(match, userId, unreadCount);
    })
  );

  return {
    chats: chats.sort((left, right) => {
      const leftTime = left.latestMessage?.createdAt ?? left.matchedAt;
      const rightTime = right.latestMessage?.createdAt ?? right.matchedAt;

      return new Date(rightTime).getTime() - new Date(leftTime).getTime();
    })
  };
}

export async function listMessages(userId: string, matchId: string, query: MessageListQuery) {
  const match = await ensureActiveChatMatch(userId, matchId);
  const where: Prisma.MessageWhereInput = {
    matchId
  };

  if (query.search) {
    where.body = {
      contains: query.search,
      mode: "insensitive"
    };
    where.deletedAt = null;
  }

  const messages = (await prisma.message.findMany({
    cursor: query.cursor ? { id: query.cursor } : undefined,
    include: {
      replyTo: true,
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    skip: query.cursor ? 1 : 0,
    take: query.limit + 1,
    where
  })) as ChatMessage[];
  const hasMore = messages.length > query.limit;
  const page = messages.slice(0, query.limit);

  return {
    chat: serializeChatSummary(match, userId, 0),
    hasMore,
    messages: page.reverse().map(serializeMessage),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null
  };
}

export async function sendMessage(userId: string, matchId: string, input: SendMessageInput) {
  const match = await ensureActiveChatMatch(userId, matchId);
  const peerId = otherUserId(match, userId);
  const body = cleanText(input.body);

  if (input.type === MessageType.TEXT && !body) {
    throw new HttpError(422, "EMPTY_MESSAGE", "Message cannot be empty");
  }

  if (input.replyToId) {
    const replyTo = await prisma.message.findFirst({
      where: {
        id: input.replyToId,
        matchId
      }
    });

    if (!replyTo) {
      throw new HttpError(404, "REPLY_MESSAGE_NOT_FOUND", "Reply target was not found");
    }
  }

  const message = await prisma.$transaction(async (client) => {
    const created = await client.message.create({
      data: {
        body,
        matchId,
        mediaUrl: input.mediaUrl,
        metadata: asJson(input.metadata),
        replyToId: input.replyToId,
        senderId: userId,
        type: input.type
      },
      include: {
        replyTo: true,
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const now = new Date();

    await ensureState(client, matchId, peerId);
    await client.chatParticipantState.upsert({
      create: {
        lastDeliveredAt: now,
        lastReadAt: now,
        matchId,
        userId
      },
      update: {
        archivedAt: null,
        lastDeliveredAt: now,
        lastReadAt: now
      },
      where: {
        matchId_userId: {
          matchId,
          userId
        }
      }
    });

    await client.notification.create({
      data: {
        body: body ?? "Sent you a new message.",
        channel: NotificationChannel.IN_APP,
        data: {
          matchId,
          messageId: created.id
        },
        title: "New message",
        type: NotificationType.MESSAGE,
        userId: peerId
      }
    });

    return created;
  });

  return {
    message: serializeMessage(message)
  };
}

export async function editMessage(
  userId: string,
  matchId: string,
  messageId: string,
  input: EditMessageInput
) {
  await ensureActiveChatMatch(userId, matchId);
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      matchId,
      senderId: userId
    }
  });

  if (!message || message.deletedAt) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Editable message not found");
  }

  if (message.type !== MessageType.TEXT && input.body !== undefined) {
    throw new HttpError(422, "MESSAGE_NOT_EDITABLE", "Only text body edits are supported");
  }

  const body = cleanText(input.body);

  if (input.body !== undefined && !body) {
    throw new HttpError(422, "EMPTY_MESSAGE", "Message cannot be empty");
  }

  const updated = await prisma.message.update({
    data: {
      body,
      editedAt: new Date(),
      metadata: asJson(input.metadata)
    },
    include: {
      replyTo: true,
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    },
    where: {
      id: messageId
    }
  });

  return {
    message: serializeMessage(updated)
  };
}

export async function deleteMessage(userId: string, matchId: string, messageId: string) {
  await ensureActiveChatMatch(userId, matchId);
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      matchId,
      senderId: userId
    }
  });

  if (!message || message.deletedAt) {
    throw new HttpError(404, "MESSAGE_NOT_FOUND", "Deletable message not found");
  }

  const updated = await prisma.message.update({
    data: {
      body: null,
      deletedAt: new Date(),
      mediaUrl: null,
      status: MessageStatus.DELETED
    },
    include: {
      replyTo: true,
      sender: {
        select: {
          id: true,
          name: true
        }
      }
    },
    where: {
      id: messageId
    }
  });

  return {
    message: serializeMessage(updated)
  };
}

export async function markDelivered(userId: string, matchId: string) {
  await ensureActiveChatMatch(userId, matchId);
  const deliveredAt = new Date();
  const [messages] = await prisma.$transaction([
    prisma.message.updateMany({
      data: {
        status: MessageStatus.DELIVERED
      },
      where: {
        matchId,
        senderId: {
          not: userId
        },
        status: MessageStatus.SENT
      }
    }),
    prisma.chatParticipantState.upsert({
      create: {
        lastDeliveredAt: deliveredAt,
        matchId,
        userId
      },
      update: {
        lastDeliveredAt: deliveredAt
      },
      where: {
        matchId_userId: {
          matchId,
          userId
        }
      }
    })
  ]);

  return {
    deliveredAt: deliveredAt.toISOString(),
    matchId,
    updatedCount: messages.count,
    userId
  };
}

export async function markRead(userId: string, matchId: string) {
  await ensureActiveChatMatch(userId, matchId);
  const readAt = new Date();
  const [messages] = await prisma.$transaction([
    prisma.message.updateMany({
      data: {
        status: MessageStatus.READ
      },
      where: {
        matchId,
        senderId: {
          not: userId
        },
        status: {
          in: [MessageStatus.SENT, MessageStatus.DELIVERED]
        }
      }
    }),
    prisma.chatParticipantState.upsert({
      create: {
        lastDeliveredAt: readAt,
        lastReadAt: readAt,
        matchId,
        userId
      },
      update: {
        lastDeliveredAt: readAt,
        lastReadAt: readAt
      },
      where: {
        matchId_userId: {
          matchId,
          userId
        }
      }
    })
  ]);

  return {
    matchId,
    readAt: readAt.toISOString(),
    updatedCount: messages.count,
    userId
  };
}

export async function updateChatSettings(
  userId: string,
  matchId: string,
  input: ChatSettingsInput
) {
  await ensureActiveChatMatch(userId, matchId);
  const now = new Date();
  const state = await prisma.chatParticipantState.upsert({
    create: {
      archivedAt: input.archived === true ? now : null,
      matchId,
      mutedAt: input.muted === true ? now : null,
      userId
    },
    update: {
      archivedAt: input.archived === undefined ? undefined : input.archived ? now : null,
      mutedAt: input.muted === undefined ? undefined : input.muted ? now : null
    },
    where: {
      matchId_userId: {
        matchId,
        userId
      }
    }
  });

  return {
    settings: {
      archivedAt: state.archivedAt?.toISOString() ?? null,
      lastDeliveredAt: state.lastDeliveredAt?.toISOString() ?? null,
      lastReadAt: state.lastReadAt?.toISOString() ?? null,
      mutedAt: state.mutedAt?.toISOString() ?? null
    }
  };
}

export async function reportChat(userId: string, matchId: string, input: ReportChatInput) {
  const match = await ensureActiveChatMatch(userId, matchId);
  const reportedUserId = otherUserId(match, userId);
  const report = await prisma.report.create({
    data: {
      description: cleanText(input.description),
      metadata: {
        matchId
      },
      reason: cleanText(input.reason) ?? input.reason,
      reportedUserId,
      reporterId: userId
    }
  });

  await prisma.auditLog.create({
    data: {
      action: AuditAction.REPORT_CREATED,
      actorId: userId,
      entity: "Report",
      entityId: report.id,
      metadata: {
        matchId,
        reportedUserId
      }
    }
  });

  return {
    report: {
      createdAt: report.createdAt.toISOString(),
      id: report.id,
      status: report.status
    }
  };
}

export async function blockChatUser(userId: string, matchId: string) {
  const match = await ensureActiveChatMatch(userId, matchId);
  const blockedUserId = otherUserId(match, userId);
  const block = await prisma.$transaction(async (client) => {
    const createdBlock = await client.block.upsert({
      create: {
        blockedUserId,
        blockerId: userId
      },
      update: {},
      where: {
        blockerId_blockedUserId: {
          blockedUserId,
          blockerId: userId
        }
      }
    });

    await client.match.update({
      data: {
        status: MatchStatus.BLOCKED,
        unmatchedAt: new Date()
      },
      where: {
        id: matchId
      }
    });

    await client.auditLog.create({
      data: {
        action: AuditAction.USER_BLOCKED,
        actorId: userId,
        entity: "Block",
        entityId: createdBlock.id,
        metadata: {
          blockedUserId,
          matchId
        }
      }
    });

    return createdBlock;
  });

  return {
    block: {
      blockedUserId,
      createdAt: block.createdAt.toISOString(),
      id: block.id
    }
  };
}
