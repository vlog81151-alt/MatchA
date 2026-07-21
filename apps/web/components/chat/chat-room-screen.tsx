"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BellOff,
  Flag,
  Image,
  Mic,
  MoreHorizontal,
  Pencil,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Smile,
  Trash2,
  User
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, FloralFrame, Logo } from "@matcha/ui";

import {
  blockChat,
  deleteChatMessage,
  editChatMessage,
  getChatMessages,
  markChatRead,
  reportChat,
  sendChatMessage,
  updateChatSettings,
  type ChatMessage,
  type ChatMessageType,
  type ChatSummary,
  type SendChatMessagePayload
} from "@/lib/chat-client";
import { createChatSocket, type MatchaChatSocket } from "@/lib/chat-socket";
import { getProfile } from "@/lib/profile-client";

const emojis = ["🙂", "😂", "✨", "🌸", "☕", "🎵"];

function primaryPhoto(chat: ChatSummary | undefined) {
  return chat?.profile.photos.find((photo) => photo.isPrimary) ?? chat?.profile.photos[0];
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function messageText(message: ChatMessage): string {
  if (message.deletedAt || message.status === "DELETED") {
    return "Message deleted";
  }

  if (message.body) {
    return message.body;
  }

  if (message.type === "IMAGE") {
    return "Image";
  }

  if (message.type === "GIF") {
    return "GIF";
  }

  if (message.type === "VOICE") {
    return "Voice note";
  }

  return "Message";
}

function upsertMessage(messages: ChatMessage[], next: ChatMessage): ChatMessage[] {
  const exists = messages.some((message) => message.id === next.id);

  if (exists) {
    return messages.map((message) => (message.id === next.id ? next : message));
  }

  return [...messages, next].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function ChatRoomScreen({ matchId }: { matchId: string }): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const socketRef = useRef<MatchaChatSocket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [messageType, setMessageType] = useState<ChatMessageType>("TEXT");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(() => new Set<string>());
  const [toolsOpen, setToolsOpen] = useState(false);

  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const messagesQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: () =>
      getChatMessages(matchId, {
        limit: 50,
        search: search.trim() || undefined
      }),
    queryKey: ["chat-room", matchId, "messages", search.trim()]
  });
  const currentUserId = profileQuery.data?.id;
  const chat = messagesQuery.data?.chat;
  const photo = primaryPhoto(chat);
  const unreadIncomingMarker = useMemo(
    () =>
      messages.find(
        (message) =>
          message.senderId !== currentUserId &&
          message.status !== "READ" &&
          message.status !== "DELETED"
      )?.id,
    [currentUserId, messages]
  );

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace("/login");
      return;
    }

    if (profileQuery.data && profileQuery.data.profileCompletion < 85) {
      router.replace("/onboarding");
    }
  }, [profileQuery.data, profileQuery.isError, router]);

  useEffect(() => {
    setMessages(messagesQuery.data?.messages ?? []);
  }, [messagesQuery.data?.messages]);

  useEffect(() => {
    if (!currentUserId) {
      return undefined;
    }

    const socket = createChatSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("chat:join", { matchId }, (response) => {
        if (!response.ok) {
          setStatusMessage(response.error.message);
        }
      });
      socket.emit("chat:message:read", { matchId });
    });

    socket.on("chat:message:new", (message) => {
      if (message.matchId !== matchId) {
        return;
      }

      setMessages((current) => upsertMessage(current, message));
      void queryClient.invalidateQueries({
        queryKey: ["chat-list"]
      });

      if (message.senderId !== currentUserId) {
        socket.emit("chat:message:read", { matchId });
      }
    });

    socket.on("chat:message:read", (payload) => {
      if (payload.matchId !== matchId) {
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.senderId === currentUserId && message.status !== "DELETED"
            ? {
                ...message,
                status: "READ"
              }
            : message
        )
      );
    });

    socket.on("chat:message:delivered", (payload) => {
      if (payload.matchId !== matchId) {
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.senderId === currentUserId && message.status === "SENT"
            ? {
                ...message,
                status: "DELIVERED"
              }
            : message
        )
      );
    });

    socket.on("chat:typing", (payload) => {
      if (payload.matchId === matchId && payload.userId !== currentUserId) {
        setTypingUser(payload.typing ? payload.userId : null);
      }
    });

    socket.on("chat:presence", (payload) => {
      setOnlineUsers((current) => {
        const next = new Set(current);

        if (payload.online) {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }

        return next;
      });
    });

    socket.connect();

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      socket.emit("chat:leave", { matchId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, matchId, queryClient]);

  useEffect(() => {
    if (!unreadIncomingMarker || search.trim()) {
      return;
    }

    void markChatRead(matchId)
      .then(() => {
        setMessages((current) =>
          current.map((message) =>
            message.senderId !== currentUserId && message.status !== "DELETED"
              ? {
                  ...message,
                  status: "READ"
                }
              : message
          )
        );
        void queryClient.invalidateQueries({
          queryKey: ["chat-list"]
        });
      })
      .catch((error: unknown) => {
        setStatusMessage(
          error instanceof Error ? error.message : "Could not mark messages as read"
        );
      });
  }, [currentUserId, matchId, queryClient, search, unreadIncomingMarker]);

  const editMutation = useMutation({
    mutationFn: ({ messageId, nextBody }: { messageId: string; nextBody: string }) =>
      editChatMessage(matchId, messageId, {
        body: nextBody
      }),
    onError: (error: Error) => setStatusMessage(error.message),
    onSuccess: (result) => {
      setMessages((current) => upsertMessage(current, result.message));
      setEditing(null);
      setBody("");
      setStatusMessage("Message updated.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => deleteChatMessage(matchId, messageId),
    onError: (error: Error) => setStatusMessage(error.message),
    onSuccess: (result) => {
      setMessages((current) => upsertMessage(current, result.message));
      setStatusMessage("Message deleted.");
    }
  });

  const settingsMutation = useMutation({
    mutationFn: (payload: { archived?: boolean; matchId: string; muted?: boolean }) =>
      updateChatSettings(payload.matchId, {
        archived: payload.archived,
        muted: payload.muted
      }),
    onError: (error: Error) => setStatusMessage(error.message),
    onSuccess: () => {
      setStatusMessage("Chat settings updated.");
      setToolsOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["chat-list"]
      });
    }
  });

  const reportMutation = useMutation({
    mutationFn: (payload: { description?: string; matchId: string; reason: string }) =>
      reportChat(payload.matchId, {
        description: payload.description,
        reason: payload.reason
      }),
    onError: (error: Error) => setStatusMessage(error.message),
    onSuccess: () => {
      setStatusMessage("Report submitted for review.");
      setToolsOpen(false);
    }
  });

  const blockMutation = useMutation({
    mutationFn: blockChat,
    onError: (error: Error) => setStatusMessage(error.message),
    onSuccess: () => {
      setStatusMessage("User blocked.");
      router.replace("/chats");
    }
  });

  const fallbackSendMutation = useMutation({
    mutationFn: (payload: SendChatMessagePayload) => sendChatMessage(matchId, payload),
    onError: (error: Error) => setStatusMessage(error.message),
    onSuccess: (result) => {
      setMessages((current) => upsertMessage(current, result.message));
      void queryClient.invalidateQueries({
        queryKey: ["chat-list"]
      });
    }
  });

  const peerOnline = useMemo(() => {
    if (!chat) {
      return false;
    }

    return onlineUsers.has(chat.profile.id);
  }, [chat, onlineUsers]);

  function emitTyping(): void {
    const socket = socketRef.current;

    if (!socket?.connected) {
      return;
    }

    socket.emit("chat:typing:start", { matchId });

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      socket.emit("chat:typing:stop", { matchId });
    }, 1200);
  }

  function resetComposer(): void {
    setBody("");
    setMediaUrl("");
    setReplyTo(null);
    setEditing(null);
    setMessageType("TEXT");
  }

  function submitMessage(): void {
    setStatusMessage(null);

    if (!editing && messageType === "TEXT" && !body.trim()) {
      return;
    }

    if (!editing && messageType !== "TEXT" && !mediaUrl.trim()) {
      setStatusMessage("Add a media URL before sending this message type.");
      return;
    }

    if (editing) {
      if (!body.trim()) {
        return;
      }

      editMutation.mutate({
        messageId: editing.id,
        nextBody: body
      });
      return;
    }

    const payload: SendChatMessagePayload = {
      body: body.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
      replyToId: replyTo?.id,
      type: messageType
    };

    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit(
        "chat:message:send",
        {
          ...payload,
          matchId
        },
        (response) => {
          if (response.ok) {
            setMessages((current) => upsertMessage(current, response.data.message));
            resetComposer();
            void queryClient.invalidateQueries({
              queryKey: ["chat-list"]
            });
          } else {
            setStatusMessage(response.error.message);
          }
        }
      );
      return;
    }

    fallbackSendMutation.mutate(payload, {
      onSuccess: () => resetComposer()
    });
  }

  function startEdit(message: ChatMessage): void {
    setEditing(message);
    setReplyTo(null);
    setMessageType("TEXT");
    setBody(message.body ?? "");
  }

  const sending =
    editMutation.isPending ||
    deleteMutation.isPending ||
    fallbackSendMutation.isPending ||
    settingsMutation.isPending ||
    reportMutation.isPending ||
    blockMutation.isPending;

  return (
    <main className="min-h-screen pb-6">
      <header className="sticky top-0 z-20 border-b border-rose-100 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-[520px] items-center justify-between px-4 py-3">
          <Button aria-label="Back to chats" asChild size="icon" type="button" variant="secondary">
            <Link href="/chats">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-rose-100 bg-rose-50 text-rose-700">
              {photo ? (
                <img
                  alt={chat?.profile.name ?? "MatchA chat"}
                  className="h-full w-full object-cover"
                  src={photo.url}
                />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl leading-none text-royal-ink">
                {chat?.profile.name ?? "Chat"}
              </h1>
              <p className="mt-1 text-xs text-zinc-600">
                {typingUser ? "typing..." : peerOnline ? "online" : "respectful conversation"}
              </p>
            </div>
          </div>
          <Button
            aria-label="Chat tools"
            onClick={() => setToolsOpen((value) => !value)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-[520px] px-4 py-4">
        {statusMessage ? (
          <div className="mb-3 rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm text-royal-ink shadow-glass">
            {statusMessage}
          </div>
        ) : null}

        {toolsOpen ? (
          <FloralFrame className="mb-4 p-3">
            <div className="grid gap-2 rounded-[1.3rem] border border-rose-100 bg-white/80 p-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={sending}
                  onClick={() =>
                    settingsMutation.mutate({
                      archived: !chat?.settings.archivedAt,
                      matchId
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  <Archive className="h-4 w-4" />
                  {chat?.settings.archivedAt ? "unarchive" : "archive"}
                </Button>
                <Button
                  disabled={sending}
                  onClick={() =>
                    settingsMutation.mutate({
                      matchId,
                      muted: !chat?.settings.mutedAt
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  <BellOff className="h-4 w-4" />
                  {chat?.settings.mutedAt ? "unmute" : "mute"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={sending}
                  onClick={() =>
                    reportMutation.mutate({
                      description: "Reported from the chat screen.",
                      matchId,
                      reason: "Chat safety concern"
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  <Flag className="h-4 w-4" />
                  report
                </Button>
                <Button
                  disabled={sending}
                  onClick={() => blockMutation.mutate(matchId)}
                  type="button"
                  variant="royal"
                >
                  <ShieldAlert className="h-4 w-4" />
                  block
                </Button>
              </div>
            </div>
          </FloralFrame>
        ) : null}

        <label className="mb-4 flex h-11 items-center gap-3 rounded-2xl border border-rose-100 bg-white/75 px-4 text-sm text-zinc-600 shadow-glass">
          <Search className="h-4 w-4 text-rose-700" />
          <input
            className="min-w-0 flex-1 bg-transparent text-royal-ink outline-none placeholder:text-zinc-500"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this chat"
            type="search"
            value={search}
          />
        </label>

        <FloralFrame className="p-3">
          <div className="flex min-h-[56vh] flex-col gap-3 rounded-[1.4rem] border border-rose-100 bg-white/70 p-3">
            {messagesQuery.isLoading ? (
              <div className="grid flex-1 place-items-center text-sm font-medium text-royal-ink">
                Loading messages
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const mine = message.senderId === currentUserId;

                return (
                  <div
                    className={mine ? "flex justify-end" : "flex justify-start"}
                    key={message.id}
                  >
                    <article
                      className={
                        mine
                          ? "max-w-[82%] rounded-2xl rounded-br-md bg-rose-gold px-4 py-3 text-white shadow-glass"
                          : "max-w-[82%] rounded-2xl rounded-bl-md border border-rose-100 bg-cream-50 px-4 py-3 text-royal-ink shadow-glass"
                      }
                    >
                      {message.replyTo ? (
                        <div
                          className={
                            mine
                              ? "mb-2 rounded-xl bg-white/15 px-3 py-2 text-xs text-white/85"
                              : "mb-2 rounded-xl bg-white px-3 py-2 text-xs text-zinc-600"
                          }
                        >
                          {message.replyTo.body ?? "Reply"}
                        </div>
                      ) : null}

                      {message.type === "IMAGE" || message.type === "GIF" ? (
                        message.mediaUrl ? (
                          <img
                            alt={message.type === "GIF" ? "GIF message" : "Image message"}
                            className="mb-2 max-h-64 rounded-xl object-cover"
                            src={message.mediaUrl}
                          />
                        ) : null
                      ) : null}

                      {message.type === "VOICE" && message.mediaUrl ? (
                        <audio className="mb-2 max-w-full" controls src={message.mediaUrl}>
                          <track kind="captions" />
                        </audio>
                      ) : null}

                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {messageText(message)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] opacity-80">
                        <span>
                          {formatTime(message.createdAt)}
                          {message.editedAt ? " - edited" : ""}
                        </span>
                        {mine ? <span>{message.status.toLowerCase()}</span> : null}
                      </div>

                      {!message.deletedAt ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            className={mine ? "text-xs text-white/90" : "text-xs text-rose-700"}
                            onClick={() => setReplyTo(message)}
                            type="button"
                          >
                            <Reply className="mr-1 inline h-3.5 w-3.5" />
                            reply
                          </button>
                          {mine && message.type === "TEXT" ? (
                            <button
                              className="text-xs text-white/90"
                              onClick={() => startEdit(message)}
                              type="button"
                            >
                              <Pencil className="mr-1 inline h-3.5 w-3.5" />
                              edit
                            </button>
                          ) : null}
                          {mine ? (
                            <button
                              className="text-xs text-white/90"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(message.id)}
                              type="button"
                            >
                              <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                              delete
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  </div>
                );
              })
            ) : (
              <div className="grid flex-1 place-items-center px-6 text-center">
                <div>
                  <Logo />
                  <p className="mt-4 text-sm leading-6 text-zinc-600">
                    Start the chat with a specific note, a safe plan, or a small shared vibe.
                  </p>
                </div>
              </div>
            )}
          </div>
        </FloralFrame>

        <div className="sticky bottom-0 mt-3 rounded-[1.4rem] border border-rose-100 bg-cream-50/95 p-3 shadow-aura backdrop-blur">
          {replyTo || editing ? (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-white/75 px-3 py-2 text-xs text-royal-ink">
              <span className="line-clamp-1">
                {editing
                  ? `Editing: ${editing.body ?? ""}`
                  : `Replying to: ${messageText(replyTo!)}`}
              </span>
              <button onClick={resetComposer} type="button">
                cancel
              </button>
            </div>
          ) : null}

          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {emojis.map((emoji) => (
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-rose-100 bg-white text-lg"
                key={emoji}
                onClick={() => {
                  setBody((value) => `${value}${emoji}`);
                  emitTyping();
                }}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="mb-2 grid grid-cols-[112px_1fr] gap-2">
            <select
              className="h-11 rounded-xl border border-rose-100 bg-white px-3 text-sm text-royal-ink outline-none"
              disabled={Boolean(editing)}
              onChange={(event) => setMessageType(event.target.value as ChatMessageType)}
              value={messageType}
            >
              <option value="TEXT">Text</option>
              <option value="IMAGE">Image</option>
              <option value="GIF">GIF</option>
              <option value="VOICE">Voice</option>
            </select>
            <input
              className="h-11 rounded-xl border border-rose-100 bg-white px-3 text-sm text-royal-ink outline-none placeholder:text-zinc-500"
              disabled={messageType === "TEXT" || Boolean(editing)}
              onChange={(event) => setMediaUrl(event.target.value)}
              placeholder="Media URL"
              value={mediaUrl}
            />
          </div>

          <div className="flex items-end gap-2">
            <textarea
              className="min-h-12 flex-1 resize-none rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm leading-5 text-royal-ink outline-none placeholder:text-zinc-500"
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                  return;
                }

                event.preventDefault();
                submitMessage();
              }}
              onChange={(event) => {
                setBody(event.target.value);
                emitTyping();
              }}
              placeholder={
                messageType === "TEXT" || editing ? "Write a message" : "Optional caption"
              }
              rows={1}
              value={body}
            />
            <Button
              aria-label={editing ? "Save edit" : "Send message"}
              disabled={sending}
              onClick={submitMessage}
              size="icon"
              type="button"
            >
              {messageType === "IMAGE" ? <Image className="h-5 w-5" /> : null}
              {messageType === "VOICE" ? <Mic className="h-5 w-5" /> : null}
              {messageType === "GIF" ? <Smile className="h-5 w-5" /> : null}
              {messageType === "TEXT" || editing ? <Send className="h-5 w-5" /> : null}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
