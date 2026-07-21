import {
  AuditAction,
  NotificationChannel,
  NotificationType,
  ReportStatus,
  VerificationStatus,
  type AuditLog,
  type Concert,
  type Event,
  type Notification,
  type Photo,
  type Prisma,
  type Report,
  type User,
  type Verification
} from "@prisma/client";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import type {
  AdminBroadcastInput,
  AdminEventQuery,
  AdminListQuery,
  AdminPublishInput,
  AdminReportReviewInput,
  AdminUserActionInput,
  AdminVerificationReviewInput
} from "./admin.schemas.js";

type AdminUser = User & {
  photos: Photo[];
};

type AdminReport = Report & {
  reportedUser: Pick<User, "email" | "id" | "isBanned" | "name" | "verificationStatus">;
  reporter: Pick<User, "email" | "id" | "name">;
};

type AdminVerification = Verification & {
  user: Pick<User, "email" | "id" | "name" | "verificationStatus"> & {
    photos: Photo[];
  };
};

type AdminAuditLog = AuditLog & {
  actor: Pick<User, "email" | "id" | "name" | "role"> | null;
};

const userInclude = {
  photos: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    take: 1
  }
} satisfies Prisma.UserInclude;

function serializeUser(user: AdminUser) {
  return {
    age: user.age,
    bannedAt: user.bannedAt?.toISOString() ?? null,
    city: user.city,
    createdAt: user.createdAt.toISOString(),
    deletedAt: user.deletedAt?.toISOString() ?? null,
    email: user.email,
    id: user.id,
    isBanned: user.isBanned,
    name: user.name,
    primaryPhoto: user.photos[0]?.url ?? null,
    profileCompletion: user.profileCompletion,
    role: user.role,
    updatedAt: user.updatedAt.toISOString(),
    verificationStatus: user.verificationStatus
  };
}

function serializeReport(report: AdminReport) {
  return {
    createdAt: report.createdAt.toISOString(),
    description: report.description,
    id: report.id,
    metadata: report.metadata,
    reason: report.reason,
    reportedUser: report.reportedUser,
    reporter: report.reporter,
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
    status: report.status,
    updatedAt: report.updatedAt.toISOString()
  };
}

function serializeVerification(verification: AdminVerification) {
  return {
    createdAt: verification.createdAt.toISOString(),
    evidenceUrl: verification.evidenceUrl,
    id: verification.id,
    providerRef: verification.providerRef,
    reason: verification.reason,
    reviewedAt: verification.reviewedAt?.toISOString() ?? null,
    reviewedBy: verification.reviewedBy,
    status: verification.status,
    type: verification.type,
    updatedAt: verification.updatedAt.toISOString(),
    user: {
      ...verification.user,
      primaryPhoto: verification.user.photos[0]?.url ?? null
    }
  };
}

function serializeEvent(event: Event) {
  return {
    category: event.category,
    city: event.city,
    coverImage: event.coverImage,
    createdAt: event.createdAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    id: event.id,
    isPublished: event.isPublished,
    startsAt: event.startsAt.toISOString(),
    title: event.title,
    updatedAt: event.updatedAt.toISOString(),
    venue: event.venue
  };
}

function serializeConcert(concert: Concert) {
  return {
    artist: concert.artist,
    city: concert.city,
    coverImage: concert.coverImage,
    createdAt: concert.createdAt.toISOString(),
    genreTags: concert.genreTags,
    id: concert.id,
    isPublished: concert.isPublished,
    startsAt: concert.startsAt.toISOString(),
    title: concert.title,
    updatedAt: concert.updatedAt.toISOString(),
    venue: concert.venue
  };
}

function serializeAuditLog(log: AdminAuditLog) {
  return {
    action: log.action,
    actor: log.actor,
    createdAt: log.createdAt.toISOString(),
    entity: log.entity,
    entityId: log.entityId,
    id: log.id,
    ipAddress: log.ipAddress,
    metadata: log.metadata,
    userAgent: log.userAgent
  };
}

function serializeNotification(notification: Notification) {
  return {
    body: notification.body,
    channel: notification.channel,
    createdAt: notification.createdAt.toISOString(),
    id: notification.id,
    title: notification.title,
    type: notification.type,
    userId: notification.userId
  };
}

async function ensureAdmin(adminUserId: string) {
  const admin = await prisma.user.findUnique({
    where: {
      id: adminUserId
    }
  });

  if (!admin || admin.deletedAt || admin.isBanned || admin.role !== "ADMIN") {
    throw new HttpError(403, "ADMIN_REQUIRED", "Admin access is required");
  }

  return admin;
}

async function writeAdminAudit({
  actorId,
  entity,
  entityId,
  metadata
}: {
  actorId: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      action: AuditAction.ADMIN_ACTION,
      actorId,
      entity,
      entityId,
      metadata
    }
  });
}

function userSearchWhere(query: AdminListQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.status === "BANNED") {
    where.isBanned = true;
  } else if (query.status === "ACTIVE") {
    where.deletedAt = null;
    where.isBanned = false;
  } else if (query.status === "DELETED") {
    where.deletedAt = {
      not: null
    };
  } else if (query.status) {
    where.verificationStatus = query.status as VerificationStatus;
  }

  if (query.q) {
    where.OR = [
      {
        email: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        name: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        city: {
          contains: query.q,
          mode: "insensitive"
        }
      }
    ];
  }

  return where;
}

export async function getAdminMe(adminUserId: string) {
  const admin = await ensureAdmin(adminUserId);

  return {
    admin: serializeUser({
      ...admin,
      photos: []
    })
  };
}

export async function getAdminDashboard(adminUserId: string) {
  await ensureAdmin(adminUserId);

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    deletedUsers,
    pendingReports,
    openReports,
    verificationQueue,
    publishedEvents,
    publishedConcerts,
    totalMatches,
    totalMessages,
    instantDateRequests,
    newUsersThisWeek,
    recentAuditLogs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        deletedAt: null,
        isBanned: false
      }
    }),
    prisma.user.count({
      where: {
        isBanned: true
      }
    }),
    prisma.user.count({
      where: {
        deletedAt: {
          not: null
        }
      }
    }),
    prisma.report.count({
      where: {
        status: {
          in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW]
        }
      }
    }),
    prisma.report.count({
      where: {
        status: ReportStatus.OPEN
      }
    }),
    prisma.verification.count({
      where: {
        status: VerificationStatus.MANUAL_REVIEW
      }
    }),
    prisma.event.count({
      where: {
        isPublished: true
      }
    }),
    prisma.concert.count({
      where: {
        isPublished: true
      }
    }),
    prisma.match.count(),
    prisma.message.count(),
    prisma.instantDate.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: since
        }
      }
    }),
    prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            email: true,
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 8
    }) as Promise<AdminAuditLog[]>
  ]);

  return {
    metrics: {
      activeUsers,
      bannedUsers,
      deletedUsers,
      instantDateRequests,
      newUsersThisWeek,
      openReports,
      pendingReports,
      publishedConcerts,
      publishedEvents,
      totalMatches,
      totalMessages,
      totalUsers,
      verificationQueue
    },
    recentAuditLogs: recentAuditLogs.map(serializeAuditLog)
  };
}

export async function listAdminUsers(adminUserId: string, query: AdminListQuery) {
  await ensureAdmin(adminUserId);
  const users = (await prisma.user.findMany({
    include: userInclude,
    orderBy: {
      createdAt: "desc"
    },
    take: query.limit,
    where: userSearchWhere(query)
  })) as AdminUser[];

  return {
    users: users.map(serializeUser)
  };
}

export async function banUser(adminUserId: string, userId: string, input: AdminUserActionInput) {
  await ensureAdmin(adminUserId);

  if (adminUserId === userId) {
    throw new HttpError(400, "ADMIN_SELF_ACTION", "Admins cannot ban their own account");
  }

  const user = await prisma.user.update({
    data: {
      bannedAt: new Date(),
      isBanned: true
    },
    include: userInclude,
    where: {
      id: userId
    }
  });

  await prisma.session.updateMany({
    data: {
      revokedAt: new Date()
    },
    where: {
      userId
    }
  });
  await writeAdminAudit({
    actorId: adminUserId,
    entity: "User",
    entityId: userId,
    metadata: {
      action: "ban",
      reason: input.reason
    }
  });

  return {
    user: serializeUser(user)
  };
}

export async function unbanUser(adminUserId: string, userId: string, input: AdminUserActionInput) {
  await ensureAdmin(adminUserId);
  const user = await prisma.user.update({
    data: {
      bannedAt: null,
      isBanned: false
    },
    include: userInclude,
    where: {
      id: userId
    }
  });

  await writeAdminAudit({
    actorId: adminUserId,
    entity: "User",
    entityId: userId,
    metadata: {
      action: "unban",
      reason: input.reason
    }
  });

  return {
    user: serializeUser(user)
  };
}

export async function deleteUser(adminUserId: string, userId: string, input: AdminUserActionInput) {
  await ensureAdmin(adminUserId);

  if (adminUserId === userId) {
    throw new HttpError(400, "ADMIN_SELF_ACTION", "Admins cannot delete their own account");
  }

  const user = await prisma.user.update({
    data: {
      deletedAt: new Date(),
      isBanned: true
    },
    include: userInclude,
    where: {
      id: userId
    }
  });

  await prisma.session.updateMany({
    data: {
      revokedAt: new Date()
    },
    where: {
      userId
    }
  });
  await writeAdminAudit({
    actorId: adminUserId,
    entity: "User",
    entityId: userId,
    metadata: {
      action: "delete",
      reason: input.reason
    }
  });

  return {
    user: serializeUser(user)
  };
}

export async function listReports(adminUserId: string, query: AdminListQuery) {
  await ensureAdmin(adminUserId);
  const where: Prisma.ReportWhereInput = {};

  if (query.status) {
    where.status = query.status as ReportStatus;
  }

  if (query.q) {
    where.OR = [
      {
        reason: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        reporter: {
          email: {
            contains: query.q,
            mode: "insensitive"
          }
        }
      },
      {
        reportedUser: {
          email: {
            contains: query.q,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  const reports = (await prisma.report.findMany({
    include: {
      reportedUser: {
        select: {
          email: true,
          id: true,
          isBanned: true,
          name: true,
          verificationStatus: true
        }
      },
      reporter: {
        select: {
          email: true,
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: query.limit,
    where
  })) as AdminReport[];

  return {
    reports: reports.map(serializeReport)
  };
}

export async function reviewReport(
  adminUserId: string,
  reportId: string,
  input: AdminReportReviewInput
) {
  await ensureAdmin(adminUserId);
  const report = await prisma.report.update({
    data: {
      metadata: {
        adminReason: input.reason
      },
      resolvedAt:
        input.status === ReportStatus.RESOLVED || input.status === ReportStatus.DISMISSED
          ? new Date()
          : null,
      status: input.status
    },
    include: {
      reportedUser: {
        select: {
          email: true,
          id: true,
          isBanned: true,
          name: true,
          verificationStatus: true
        }
      },
      reporter: {
        select: {
          email: true,
          id: true,
          name: true
        }
      }
    },
    where: {
      id: reportId
    }
  });

  await writeAdminAudit({
    actorId: adminUserId,
    entity: "Report",
    entityId: reportId,
    metadata: {
      reason: input.reason,
      status: input.status
    }
  });

  return {
    report: serializeReport(report)
  };
}

export async function listVerifications(adminUserId: string, query: AdminListQuery) {
  await ensureAdmin(adminUserId);
  const where: Prisma.VerificationWhereInput = {};

  if (query.status) {
    where.status = query.status as VerificationStatus;
  }

  if (query.q) {
    where.OR = [
      {
        type: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        user: {
          email: {
            contains: query.q,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  const verifications = (await prisma.verification.findMany({
    include: {
      user: {
        select: {
          email: true,
          id: true,
          name: true,
          photos: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
            take: 1
          },
          verificationStatus: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: query.limit,
    where
  })) as AdminVerification[];

  return {
    verifications: verifications.map(serializeVerification)
  };
}

export async function reviewVerification(
  adminUserId: string,
  verificationId: string,
  input: AdminVerificationReviewInput
) {
  await ensureAdmin(adminUserId);
  const verification = await prisma.$transaction(async (client) => {
    const updatedVerification = await client.verification.update({
      data: {
        reason: input.reason,
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        status: input.status
      },
      include: {
        user: {
          select: {
            email: true,
            id: true,
            name: true,
            photos: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
              take: 1
            },
            verificationStatus: true
          }
        }
      },
      where: {
        id: verificationId
      }
    });

    await client.user.update({
      data: {
        verificationStatus: input.status
      },
      where: {
        id: updatedVerification.userId
      }
    });

    await client.notification.create({
      data: {
        body:
          input.status === VerificationStatus.REJECTED
            ? "Your verification could not be approved yet. Please review your profile."
            : "Your profile verification has been approved.",
        channel: NotificationChannel.IN_APP,
        data: {
          verificationId
        },
        title:
          input.status === VerificationStatus.REJECTED
            ? "Verification needs attention"
            : "Verification approved",
        type: NotificationType.VERIFICATION,
        userId: updatedVerification.userId
      }
    });

    await client.auditLog.create({
      data: {
        action: AuditAction.VERIFICATION_REVIEWED,
        actorId: adminUserId,
        entity: "Verification",
        entityId: verificationId,
        metadata: {
          reason: input.reason,
          status: input.status
        }
      }
    });

    return updatedVerification;
  });

  return {
    verification: serializeVerification(verification)
  };
}

export async function listAdminEvents(adminUserId: string, query: AdminEventQuery) {
  await ensureAdmin(adminUserId);
  const where: Prisma.EventWhereInput = {};

  if (query.category) {
    where.category = query.category;
  }

  if (query.status === "PUBLISHED") {
    where.isPublished = true;
  } else if (query.status === "DRAFT") {
    where.isPublished = false;
  }

  if (query.q) {
    where.OR = [
      {
        title: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        city: {
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

  const events = await prisma.event.findMany({
    orderBy: {
      startsAt: "asc"
    },
    take: query.limit,
    where
  });

  return {
    events: events.map(serializeEvent)
  };
}

export async function updateEventPublishState(
  adminUserId: string,
  eventId: string,
  input: AdminPublishInput
) {
  await ensureAdmin(adminUserId);
  const event = await prisma.event.update({
    data: {
      isPublished: input.isPublished
    },
    where: {
      id: eventId
    }
  });

  await writeAdminAudit({
    actorId: adminUserId,
    entity: "Event",
    entityId: eventId,
    metadata: {
      isPublished: input.isPublished
    }
  });

  return {
    event: serializeEvent(event)
  };
}

export async function listAdminConcerts(adminUserId: string, query: AdminListQuery) {
  await ensureAdmin(adminUserId);
  const where: Prisma.ConcertWhereInput = {};

  if (query.status === "PUBLISHED") {
    where.isPublished = true;
  } else if (query.status === "DRAFT") {
    where.isPublished = false;
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
        city: {
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

  const concerts = await prisma.concert.findMany({
    orderBy: {
      startsAt: "asc"
    },
    take: query.limit,
    where
  });

  return {
    concerts: concerts.map(serializeConcert)
  };
}

export async function updateConcertPublishState(
  adminUserId: string,
  concertId: string,
  input: AdminPublishInput
) {
  await ensureAdmin(adminUserId);
  const concert = await prisma.concert.update({
    data: {
      isPublished: input.isPublished
    },
    where: {
      id: concertId
    }
  });

  await writeAdminAudit({
    actorId: adminUserId,
    entity: "Concert",
    entityId: concertId,
    metadata: {
      isPublished: input.isPublished
    }
  });

  return {
    concert: serializeConcert(concert)
  };
}

export async function broadcastNotification(adminUserId: string, input: AdminBroadcastInput) {
  await ensureAdmin(adminUserId);
  const where: Prisma.UserWhereInput = {
    deletedAt: null
  };

  if (input.audience === "ACTIVE") {
    where.isBanned = false;
  }

  if (input.audience === "CITY") {
    where.city = {
      equals: input.city,
      mode: "insensitive"
    };
    where.isBanned = false;
  }

  const recipients = await prisma.user.findMany({
    select: {
      id: true
    },
    where
  });

  if (recipients.length === 0) {
    return {
      broadcast: {
        audience: input.audience,
        createdCount: 0,
        notifications: []
      }
    };
  }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      body: input.body,
      channel: input.channel,
      data: {
        audience: input.audience,
        city: input.city,
        source: "admin_broadcast"
      },
      sentAt: new Date(),
      title: input.title,
      type: input.type,
      userId: recipient.id
    }))
  });

  const notifications = await prisma.notification.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: Math.min(recipients.length, 5),
    where: {
      body: input.body,
      title: input.title,
      userId: {
        in: recipients.map((recipient) => recipient.id)
      }
    }
  });

  await writeAdminAudit({
    actorId: adminUserId,
    entity: "Notification",
    metadata: {
      audience: input.audience,
      channel: input.channel,
      createdCount: recipients.length,
      title: input.title,
      type: input.type
    }
  });

  return {
    broadcast: {
      audience: input.audience,
      createdCount: recipients.length,
      notifications: notifications.map(serializeNotification)
    }
  };
}

export async function listAuditLogs(adminUserId: string, query: AdminListQuery) {
  await ensureAdmin(adminUserId);
  const where: Prisma.AuditLogWhereInput = {};

  if (query.status) {
    where.action = query.status as AuditAction;
  }

  if (query.q) {
    where.OR = [
      {
        entity: {
          contains: query.q,
          mode: "insensitive"
        }
      },
      {
        actor: {
          email: {
            contains: query.q,
            mode: "insensitive"
          }
        }
      }
    ];
  }

  const logs = (await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          email: true,
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: query.limit,
    where
  })) as AdminAuditLog[];

  return {
    auditLogs: logs.map(serializeAuditLog)
  };
}
