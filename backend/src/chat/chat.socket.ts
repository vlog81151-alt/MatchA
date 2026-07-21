import cookieParser from "cookie-parser";
import { MessageType } from "@prisma/client";
import type { Server, Socket } from "socket.io";
import { z } from "zod";

import { ACCESS_TOKEN_COOKIE } from "../auth/cookie.service.js";
import { verifyAccessToken } from "../auth/token.service.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { HttpError, isHttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { ensureActiveChatMatch, markDelivered, markRead, sendMessage } from "./chat.service.js";

const matchEventSchema = z
  .object({
    matchId: z.string().trim().min(1)
  })
  .strict();

const socketSendMessageSchema = z
  .object({
    body: z.string().trim().max(2000).optional(),
    matchId: z.string().trim().min(1),
    mediaUrl: z.string().trim().url().optional(),
    metadata: z.record(z.unknown()).optional(),
    replyToId: z.string().trim().min(1).optional(),
    type: z.nativeEnum(MessageType).default(MessageType.TEXT)
  })
  .strict()
  .refine((value) => (value.type === MessageType.TEXT ? Boolean(value.body) : true), {
    message: "Text messages require a body",
    path: ["body"]
  })
  .refine((value) => value.type !== MessageType.SYSTEM, {
    message: "System messages cannot be created by clients",
    path: ["type"]
  })
  .refine(
    (value) =>
      value.type === MessageType.TEXT ||
      value.type === MessageType.SYSTEM ||
      Boolean(value.mediaUrl),
    {
      message: "Media messages require a mediaUrl",
      path: ["mediaUrl"]
    }
  );

type AckResponse<TData> =
  | {
      data: TData;
      ok: true;
    }
  | {
      error: {
        code: string;
        message: string;
      };
      ok: false;
    };

type Ack<TData> = (response: AckResponse<TData>) => void;

interface ServerToClientEvents {
  "chat:message:delivered": (payload: Awaited<ReturnType<typeof markDelivered>>) => void;
  "chat:message:new": (payload: Awaited<ReturnType<typeof sendMessage>>["message"]) => void;
  "chat:message:read": (payload: Awaited<ReturnType<typeof markRead>>) => void;
  "chat:presence": (payload: { online: boolean; userId: string }) => void;
  "chat:typing": (payload: { matchId: string; typing: boolean; userId: string }) => void;
}

interface ClientToServerEvents {
  "chat:join": (
    payload: z.infer<typeof matchEventSchema>,
    ack?: Ack<{ deliveredAt: string; matchId: string }>
  ) => void;
  "chat:leave": (payload: z.infer<typeof matchEventSchema>, ack?: Ack<{ matchId: string }>) => void;
  "chat:message:delivered": (
    payload: z.infer<typeof matchEventSchema>,
    ack?: Ack<Awaited<ReturnType<typeof markDelivered>>>
  ) => void;
  "chat:message:read": (
    payload: z.infer<typeof matchEventSchema>,
    ack?: Ack<Awaited<ReturnType<typeof markRead>>>
  ) => void;
  "chat:message:send": (
    payload: z.infer<typeof socketSendMessageSchema>,
    ack?: Ack<Awaited<ReturnType<typeof sendMessage>>>
  ) => void;
  "chat:typing:stop": (payload: z.infer<typeof matchEventSchema>) => void;
  "chat:typing:start": (payload: z.infer<typeof matchEventSchema>) => void;
}

interface SocketData {
  joinedMatchIds: Set<string>;
  userId: string;
}

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type ChatServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

const onlineSocketsByUser = new Map<string, Set<string>>();

function roomForMatch(matchId: string): string {
  return `match:${matchId}`;
}

function parseCookieHeader(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!header) {
    return cookies;
  }

  header.split(";").forEach((part) => {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (!rawName || rawValue.length === 0) {
      return;
    }

    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  });

  return cookies;
}

function readAccessToken(socket: ChatSocket): string | undefined {
  const auth = socket.handshake.auth as unknown;
  const authToken =
    auth && typeof auth === "object" && "accessToken" in auth ? auth.accessToken : undefined;

  if (typeof authToken === "string" && authToken.trim()) {
    return authToken;
  }

  const cookies = parseCookieHeader(socket.handshake.headers.cookie);
  const signedValue = cookies.get(ACCESS_TOKEN_COOKIE);

  if (!signedValue) {
    return undefined;
  }

  const unsigned = cookieParser.signedCookie(signedValue, env.COOKIE_SECRET);

  return typeof unsigned === "string" ? unsigned : undefined;
}

async function authenticateSocket(socket: ChatSocket): Promise<string> {
  const token = readAccessToken(socket);

  if (!token) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub
    }
  });

  if (!user || user.deletedAt || user.isBanned) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  return user.id;
}

function socketError(error: unknown) {
  if (isHttpError(error)) {
    return {
      code: error.code,
      message: error.message
    };
  }

  if (error instanceof z.ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: "Socket payload validation failed"
    };
  }

  return {
    code: "INTERNAL_SERVER_ERROR",
    message: "Socket action failed"
  };
}

function ackOk<TData>(ack: Ack<TData> | undefined, data: TData): void {
  ack?.({
    data,
    ok: true
  });
}

function ackError<TData>(ack: Ack<TData> | undefined, error: unknown): void {
  const payload = socketError(error);

  ack?.({
    error: payload,
    ok: false
  });
}

function markUserOnline(io: ChatServer, userId: string, socketId: string): void {
  const sockets = onlineSocketsByUser.get(userId) ?? new Set<string>();
  const wasOffline = sockets.size === 0;

  sockets.add(socketId);
  onlineSocketsByUser.set(userId, sockets);

  if (wasOffline) {
    io.emit("chat:presence", {
      online: true,
      userId
    });
  }
}

function markUserOffline(io: ChatServer, userId: string, socketId: string): void {
  const sockets = onlineSocketsByUser.get(userId);

  if (!sockets) {
    return;
  }

  sockets.delete(socketId);

  if (sockets.size > 0) {
    return;
  }

  onlineSocketsByUser.delete(userId);
  io.emit("chat:presence", {
    online: false,
    userId
  });
}

function handleAsync<TData>(
  action: () => Promise<TData>,
  ack: Ack<TData> | undefined,
  onSuccess?: (data: TData) => void
): void {
  void action()
    .then((data) => {
      onSuccess?.(data);
      ackOk(ack, data);
    })
    .catch((error: unknown) => {
      logger.warn({ error }, "Socket chat action failed");
      ackError(ack, error);
    });
}

export function registerChatSocket(io: Server): void {
  const chatIo = io as ChatServer;

  chatIo.use((socket, next) => {
    void authenticateSocket(socket)
      .then((userId) => {
        socket.data.userId = userId;
        socket.data.joinedMatchIds = new Set<string>();
        next();
      })
      .catch((error: unknown) => {
        const payload = socketError(error);

        next(new Error(payload.code));
      });
  });

  chatIo.on("connection", (chatSocket) => {
    const userId = chatSocket.data.userId;

    markUserOnline(chatIo, userId, chatSocket.id);
    logger.info({ socketId: chatSocket.id, userId }, "Chat socket connected");

    chatSocket.on("chat:join", (payload, ack) => {
      handleAsync(async () => {
        const parsed = matchEventSchema.parse(payload);

        await ensureActiveChatMatch(userId, parsed.matchId);
        await chatSocket.join(roomForMatch(parsed.matchId));
        chatSocket.data.joinedMatchIds.add(parsed.matchId);
        const delivered = await markDelivered(userId, parsed.matchId);

        chatSocket.to(roomForMatch(parsed.matchId)).emit("chat:message:delivered", delivered);

        return {
          deliveredAt: delivered.deliveredAt,
          matchId: parsed.matchId
        };
      }, ack);
    });

    chatSocket.on("chat:leave", (payload, ack) => {
      handleAsync(async () => {
        const parsed = matchEventSchema.parse(payload);

        await chatSocket.leave(roomForMatch(parsed.matchId));
        chatSocket.data.joinedMatchIds.delete(parsed.matchId);

        return {
          matchId: parsed.matchId
        };
      }, ack);
    });

    chatSocket.on("chat:typing:start", (payload) => {
      handleAsync(async () => {
        const parsed = matchEventSchema.parse(payload);

        await ensureActiveChatMatch(userId, parsed.matchId);
        chatSocket.to(roomForMatch(parsed.matchId)).emit("chat:typing", {
          matchId: parsed.matchId,
          typing: true,
          userId
        });

        return {
          matchId: parsed.matchId
        };
      }, undefined);
    });

    chatSocket.on("chat:typing:stop", (payload) => {
      handleAsync(async () => {
        const parsed = matchEventSchema.parse(payload);

        await ensureActiveChatMatch(userId, parsed.matchId);
        chatSocket.to(roomForMatch(parsed.matchId)).emit("chat:typing", {
          matchId: parsed.matchId,
          typing: false,
          userId
        });

        return {
          matchId: parsed.matchId
        };
      }, undefined);
    });

    chatSocket.on("chat:message:send", (payload, ack) => {
      handleAsync(async () => {
        const parsed = socketSendMessageSchema.parse(payload);
        const message = await sendMessage(userId, parsed.matchId, parsed);

        chatIo.to(roomForMatch(parsed.matchId)).emit("chat:message:new", message.message);

        return message;
      }, ack);
    });

    chatSocket.on("chat:message:delivered", (payload, ack) => {
      handleAsync(async () => {
        const parsed = matchEventSchema.parse(payload);
        const result = await markDelivered(userId, parsed.matchId);

        chatSocket.to(roomForMatch(parsed.matchId)).emit("chat:message:delivered", result);

        return result;
      }, ack);
    });

    chatSocket.on("chat:message:read", (payload, ack) => {
      handleAsync(async () => {
        const parsed = matchEventSchema.parse(payload);
        const result = await markRead(userId, parsed.matchId);

        chatSocket.to(roomForMatch(parsed.matchId)).emit("chat:message:read", result);

        return result;
      }, ack);
    });

    chatSocket.on("disconnect", (reason) => {
      markUserOffline(chatIo, userId, chatSocket.id);
      logger.info({ reason, socketId: chatSocket.id, userId }, "Chat socket disconnected");
    });
  });
}
