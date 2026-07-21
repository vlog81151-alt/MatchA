"use client";

import { io, type Socket } from "socket.io-client";

import { SOCKET_URL, type ChatMessage, type SendChatMessagePayload } from "@/lib/chat-client";

export type SocketAck<TData> =
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

export interface ChatSocketServerEvents {
  "chat:message:delivered": (payload: {
    deliveredAt: string;
    matchId: string;
    updatedCount: number;
    userId: string;
  }) => void;
  "chat:message:new": (payload: ChatMessage) => void;
  "chat:message:read": (payload: {
    matchId: string;
    readAt: string;
    updatedCount: number;
    userId: string;
  }) => void;
  "chat:presence": (payload: { online: boolean; userId: string }) => void;
  "chat:typing": (payload: { matchId: string; typing: boolean; userId: string }) => void;
}

export interface ChatSocketClientEvents {
  "chat:join": (
    payload: { matchId: string },
    ack?: (response: SocketAck<{ deliveredAt: string; matchId: string }>) => void
  ) => void;
  "chat:leave": (
    payload: { matchId: string },
    ack?: (response: SocketAck<{ matchId: string }>) => void
  ) => void;
  "chat:message:delivered": (
    payload: { matchId: string },
    ack?: (
      response: SocketAck<{
        deliveredAt: string;
        matchId: string;
        updatedCount: number;
        userId: string;
      }>
    ) => void
  ) => void;
  "chat:message:read": (
    payload: { matchId: string },
    ack?: (
      response: SocketAck<{
        matchId: string;
        readAt: string;
        updatedCount: number;
        userId: string;
      }>
    ) => void
  ) => void;
  "chat:message:send": (
    payload: SendChatMessagePayload & { matchId: string },
    ack?: (response: SocketAck<{ message: ChatMessage }>) => void
  ) => void;
  "chat:typing:stop": (payload: { matchId: string }) => void;
  "chat:typing:start": (payload: { matchId: string }) => void;
}

export type MatchaChatSocket = Socket<ChatSocketServerEvents, ChatSocketClientEvents>;

export function createChatSocket(): MatchaChatSocket {
  const options = {
    autoConnect: false,
    transports: ["websocket", "polling"] as Array<"websocket" | "polling">,
    withCredentials: true
  };

  const socket = SOCKET_URL ? io(SOCKET_URL, options) : io(options);

  return socket;
}
