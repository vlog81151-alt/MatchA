"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, BellOff, Heart, MessageCircle, Search, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, FloralFrame, Logo } from "@matcha/ui";

import { AppBottomNav } from "@/components/navigation/app-bottom-nav";
import { getChats, type ChatSummary } from "@/lib/chat-client";
import { getProfile } from "@/lib/profile-client";

function primaryPhoto(chat: ChatSummary) {
  return chat.profile.photos.find((photo) => photo.isPrimary) ?? chat.profile.photos[0];
}

function preview(chat: ChatSummary): string {
  if (!chat.latestMessage) {
    return "Start with something thoughtful.";
  }

  if (chat.latestMessage.deletedAt) {
    return "Message deleted";
  }

  if (chat.latestMessage.body) {
    return chat.latestMessage.body;
  }

  if (chat.latestMessage.type === "IMAGE") {
    return "Image";
  }

  if (chat.latestMessage.type === "GIF") {
    return "GIF";
  }

  if (chat.latestMessage.type === "VOICE") {
    return "Voice note";
  }

  return "New message";
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

export function ChatsScreen(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const profileQuery = useQuery({
    queryFn: getProfile,
    queryKey: ["profile", "me"]
  });
  const chatsQuery = useQuery({
    enabled: Boolean(profileQuery.data && profileQuery.data.profileCompletion >= 85),
    queryFn: () => getChats(includeArchived),
    queryKey: ["chat-list", includeArchived]
  });

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace("/login");
      return;
    }

    if (profileQuery.data && profileQuery.data.profileCompletion < 85) {
      router.replace("/onboarding");
    }
  }, [profileQuery.data, profileQuery.isError, router]);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    const chats = chatsQuery.data?.chats ?? [];

    if (!query) {
      return chats;
    }

    return chats.filter((chat) => {
      const haystack = [
        chat.profile.name,
        chat.profile.profession,
        chat.profile.city,
        chat.latestMessage?.body
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [chatsQuery.data?.chats, search]);

  const loading = profileQuery.isLoading || chatsQuery.isLoading;

  return (
    <main className="min-h-screen pb-28">
      <header className="mx-auto flex max-w-[460px] items-center justify-between px-5 py-5">
        <Button aria-label="Back to home" asChild size="icon" type="button" variant="secondary">
          <Link href="/home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Logo />
        <Button
          aria-label="Toggle archived chats"
          onClick={() => setIncludeArchived((value) => !value)}
          size="icon"
          type="button"
          variant="secondary"
        >
          <Archive className="h-5 w-5" />
        </Button>
      </header>

      <section className="mx-auto max-w-[460px] px-5">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-700">MatchA</p>
          <h1 className="font-display text-4xl text-royal-ink">chats</h1>
        </div>

        <label className="mb-4 flex h-12 items-center gap-3 rounded-2xl border border-rose-100 bg-white/75 px-4 text-sm text-zinc-600 shadow-glass">
          <Search className="h-5 w-5 text-rose-700" />
          <input
            className="min-w-0 flex-1 bg-transparent text-royal-ink outline-none placeholder:text-zinc-500"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search messages or matches"
            type="search"
            value={search}
          />
        </label>

        {includeArchived ? (
          <div className="mb-3 rounded-2xl border border-rose-100 bg-white/75 px-4 py-3 text-sm text-royal-ink shadow-glass">
            Showing archived chats too.
          </div>
        ) : null}

        {loading ? (
          <FloralFrame className="p-4">
            <div className="grid min-h-[360px] place-items-center rounded-[1.4rem] border border-rose-100 bg-white/75 text-sm font-medium text-royal-ink">
              Loading conversations
            </div>
          </FloralFrame>
        ) : filteredChats.length > 0 ? (
          <div className="grid gap-3">
            {filteredChats.map((chat) => {
              const photo = primaryPhoto(chat);
              const latestAt = chat.latestMessage?.createdAt ?? chat.matchedAt;

              return (
                <Link href={`/chats/${chat.id}`} key={chat.id}>
                  <FloralFrame className="p-2">
                    <article className="grid grid-cols-[72px_1fr] gap-4 rounded-[1.3rem] border border-rose-100 bg-white/80 p-3">
                      <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-rose-50">
                        {photo ? (
                          <img
                            alt={chat.profile.name ?? "MatchA chat"}
                            className="h-20 w-full object-cover"
                            src={photo.url}
                          />
                        ) : (
                          <div className="grid h-20 place-items-center text-rose-700">
                            <User className="h-7 w-7" />
                          </div>
                        )}
                        {chat.unreadCount > 0 ? (
                          <span className="absolute right-1 top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-700 px-1 text-xs font-bold text-white">
                            {chat.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate font-display text-2xl text-royal-ink">
                              {chat.profile.name ?? "MatchA"}
                            </h2>
                            <p className="truncate text-xs text-zinc-600">
                              {[chat.profile.profession, chat.profile.city]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-zinc-500">
                            {formatTime(latestAt)}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-royal-ink">
                          {preview(chat)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className="gap-1 bg-white">
                            <Heart className="h-3.5 w-3.5 fill-current" />
                            {chat.compatibilityScore}%
                          </Badge>
                          {chat.settings.mutedAt ? (
                            <Badge className="gap-1 bg-white">
                              <BellOff className="h-3.5 w-3.5" />
                              muted
                            </Badge>
                          ) : null}
                          {chat.settings.archivedAt ? (
                            <Badge className="gap-1 bg-white">
                              <Archive className="h-3.5 w-3.5" />
                              archived
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </FloralFrame>
                </Link>
              );
            })}
          </div>
        ) : (
          <FloralFrame className="p-4">
            <div className="grid min-h-[360px] place-items-center rounded-[1.4rem] border border-rose-100 bg-white/75 px-6 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-white text-rose-700 shadow-glass">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h2 className="mt-5 font-display text-3xl text-royal-ink">No chats yet</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Mutual matches with messages will appear here.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/matches">view matches</Link>
                </Button>
              </div>
            </div>
          </FloralFrame>
        )}
      </section>

      <AppBottomNav />
    </main>
  );
}
