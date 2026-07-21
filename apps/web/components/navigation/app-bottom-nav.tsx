"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flower2, Heart, Home, MessageCircle, User } from "lucide-react";

const bottomNav = [
  {
    href: "/home",
    icon: Home,
    label: "home"
  },
  {
    href: "/matches",
    icon: Heart,
    label: "matches"
  },
  {
    href: "/chats",
    icon: MessageCircle,
    label: "chats"
  },
  {
    href: "/aura",
    icon: Flower2,
    label: "aura"
  },
  {
    href: "/profile",
    icon: User,
    label: "me"
  }
];

export function AppBottomNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-rose-100 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto grid max-w-[460px] grid-cols-5 px-2 py-2">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className="grid justify-items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-zinc-600 transition hover:bg-white/60"
              href={item.href}
              key={item.href}
            >
              <item.icon
                className={
                  isActive ? "h-5 w-5 fill-current text-rose-700" : "h-5 w-5 text-royal-ink"
                }
              />
              <span className={isActive ? "text-rose-700" : undefined}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
