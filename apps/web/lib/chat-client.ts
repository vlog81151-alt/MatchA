import { API_URL, buildSearchParams, requestJson } from "./http-client";

export const SOCKET_URL = API_URL.startsWith("http") ? API_URL.replace(/\/api\/?$/, "") : undefined;

export type ChatMessageType = "TEXT" | "IMAGE" | "GIF" | "VOICE" | "SYSTEM";
export type ChatMessageStatus = "SENT" | "DELIVERED" | "READ" | "DELETED";

export interface ChatPhoto {
  id: string;
  isPrimary: boolean;
  status: string;
  url: string;
}

export interface ChatProfile {
  age: number | null;
  city: string | null;
  id: string;
  name: string | null;
  photos: ChatPhoto[];
  profession: string | null;
  verificationStatus: string;
}

export interface ChatSettings {
  archivedAt: string | null;
  lastDeliveredAt: string | null;
  lastReadAt: string | null;
  mutedAt: string | null;
}

export interface ChatMessage {
  body: string | null;
  createdAt: string;
  deletedAt: string | null;
  editedAt: string | null;
  id: string;
  matchId: string;
  mediaUrl: string | null;
  metadata: unknown;
  replyTo: {
    body: string | null;
    deletedAt: string | null;
    id: string;
    senderId: string;
    type: ChatMessageType;
  } | null;
  replyToId: string | null;
  sender: {
    id: string;
    name: string | null;
  };
  senderId: string;
  status: ChatMessageStatus;
  type: ChatMessageType;
}

export interface ChatSummary {
  compatibilityScore: number;
  id: string;
  latestMessage: {
    body: string | null;
    createdAt: string;
    deletedAt: string | null;
    id: string;
    senderId: string;
    status: ChatMessageStatus;
    type: ChatMessageType;
  } | null;
  matchedAt: string;
  profile: ChatProfile;
  settings: ChatSettings;
  status: string;
  unreadCount: number;
}

export interface ChatListResponse {
  chats: ChatSummary[];
}

export interface ChatMessagesResponse {
  chat: ChatSummary;
  hasMore: boolean;
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface SendChatMessagePayload {
  body?: string;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
  replyToId?: string;
  type?: ChatMessageType;
}

function search(params: Record<string, string | number | boolean | undefined>): string {
  return buildSearchParams(params);
}

export function getChats(includeArchived = false): Promise<ChatListResponse> {
  return requestJson<ChatListResponse>(`/chats${search({ includeArchived })}`);
}

export function getChatMessages(
  matchId: string,
  params: {
    cursor?: string;
    limit?: number;
    search?: string;
  } = {}
): Promise<ChatMessagesResponse> {
  return requestJson<ChatMessagesResponse>(`/chats/${matchId}/messages${search(params)}`);
}

export function sendChatMessage(
  matchId: string,
  payload: SendChatMessagePayload
): Promise<{ message: ChatMessage }> {
  return requestJson<{ message: ChatMessage }>(`/chats/${matchId}/messages`, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function editChatMessage(
  matchId: string,
  messageId: string,
  payload: { body?: string; metadata?: Record<string, unknown> }
): Promise<{ message: ChatMessage }> {
  return requestJson<{ message: ChatMessage }>(`/chats/${matchId}/messages/${messageId}`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function deleteChatMessage(
  matchId: string,
  messageId: string
): Promise<{ message: ChatMessage }> {
  return requestJson<{ message: ChatMessage }>(`/chats/${matchId}/messages/${messageId}`, {
    method: "DELETE"
  });
}

export function markChatDelivered(matchId: string): Promise<{
  deliveredAt: string;
  matchId: string;
  updatedCount: number;
  userId: string;
}> {
  return requestJson(`/chats/${matchId}/delivered`, {
    method: "POST"
  });
}

export function markChatRead(matchId: string): Promise<{
  matchId: string;
  readAt: string;
  updatedCount: number;
  userId: string;
}> {
  return requestJson(`/chats/${matchId}/read`, {
    method: "POST"
  });
}

export function updateChatSettings(
  matchId: string,
  payload: { archived?: boolean; muted?: boolean }
): Promise<{ settings: ChatSettings }> {
  return requestJson(`/chats/${matchId}/settings`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function reportChat(
  matchId: string,
  payload: { description?: string; reason: string }
): Promise<{
  report: {
    createdAt: string;
    id: string;
    status: string;
  };
}> {
  return requestJson(`/chats/${matchId}/report`, {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function blockChat(matchId: string): Promise<{
  block: {
    blockedUserId: string;
    createdAt: string;
    id: string;
  };
}> {
  return requestJson(`/chats/${matchId}/block`, {
    method: "POST"
  });
}
