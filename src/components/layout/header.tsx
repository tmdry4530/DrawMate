"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/browser-client";
import { unwrapApiData } from "@/lib/utils/client-api";
import { NotificationItem } from "@/components/notifications/notification-item";

interface UserProfile {
  displayName: string | null;
  avatarUrl: string | null;
}

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string; profile?: UserProfile } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: "message_received" | "message_replied" | "bookmark_added" | "system_notice"; title: string; body: string; isRead: boolean; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/v1/notifications?limit=20");
        if (!res.ok || !mounted) return;
        const json = await res.json();
        const data = unwrapApiData<{
          unreadCount?: number;
          items?: Array<{ id: string; type: "message_received" | "message_replied" | "bookmark_added" | "system_notice"; title: string; body: string; readAt: string | null; createdAt: string }>;
        }>(json);
        setUnreadCount(data?.unreadCount ?? 0);
        setNotifications(
          (data?.items ?? []).map((item) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            body: item.body,
            isRead: !!item.readAt,
            createdAt: item.createdAt,
          }))
        );
      } catch {
        // keep header usable even when notification fetch fails
      }
    };

    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_path")
          .eq("id", authUser.id)
          .single();
        const avatarUrl = profile?.avatar_path
          ? supabase.storage.from("profile-avatars").getPublicUrl(profile.avatar_path).data.publicUrl
          : null;
        if (mounted) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            profile: {
              displayName: profile?.display_name ?? null,
              avatarUrl,
            },
          });
          setLoading(false);
        }
        await loadNotifications();
      } else {
        if (mounted) {
          setUser(null);
          setUnreadCount(0);
          setLoading(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && mounted) {
        setUser(null);
        setUnreadCount(0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUnreadCount(0);
    router.replace("/");
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await fetch(`/api/v1/notifications/${notificationId}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/v1/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawQuery = formData.get("q");
    const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
    const nextParams = new URLSearchParams();
    if (query) nextParams.set("q", query);
    const nextUrl = nextParams.toString() ? `/explore?${nextParams.toString()}` : "/explore";
    router.push(nextUrl);
  };

  const isNavActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed top-0 w-full z-50 h-20 bg-black border-b border-white/10">
      <div className="flex justify-between items-center px-6 md:px-12 h-full w-full">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8 md:gap-12 h-full">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase shrink-0">
            DRAWMATE.
          </Link>

          <nav className="hidden md:flex items-center gap-8 h-full font-bold tracking-tighter uppercase">
            <Link
              href="/explore"
              className={`h-full flex items-center ${
                isNavActive("/explore")
                  ? "text-white border-b-2 border-white pt-0.5"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Explore
            </Link>
            <Link
              href="/studio/portfolios"
              className={`h-full flex items-center ${
                isNavActive("/studio")
                  ? "text-white border-b-2 border-white pt-0.5"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Portfolio
            </Link>
            <Link
              href="/messages"
              className={`h-full flex items-center ${
                isNavActive("/messages")
                  ? "text-white border-b-2 border-white pt-0.5"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Messages
            </Link>
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <form
            className="hidden sm:block relative"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <input
              key={`${pathname}-${searchParams.get("q") ?? ""}`}
              name="q"
              type="search"
              defaultValue={pathname === "/explore" ? searchParams.get("q") ?? "" : ""}
              placeholder="SEARCH CREATIVES"
              aria-label="포트폴리오, 분야, 스타일, 작가 검색"
              className="bg-transparent border border-white/20 text-xs px-4 py-2 w-48 lg:w-64 focus:outline-none focus:border-white text-white placeholder:text-white/30 tracking-widest uppercase rounded-none"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          </form>

          {loading ? (
            <div className="w-20" />
          ) : user ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative text-white/60 hover:text-white" aria-label="알림">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 bg-[#1b1b1b] border-neutral-800 text-white">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                    <span className="text-sm font-bold uppercase tracking-wider">알림</span>
                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAllRead} className="text-xs text-neutral-400 hover:text-white uppercase tracking-wider">
                        모두 읽음
                      </button>
                    )}
                  </div>
                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
                        <Bell className="h-8 w-8 mb-2" />
                        <p className="text-sm">알림이 없습니다</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          onMarkAsRead={handleMarkAsRead}
                        />
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-10 h-10 bg-neutral-800 border border-white/10 overflow-hidden flex items-center justify-center"
                    aria-label="프로필 메뉴 열기"
                  >
                    <Avatar className="h-10 w-10 rounded-none">
                      <AvatarImage src={user.profile?.avatarUrl ?? undefined} alt="프로필" />
                      <AvatarFallback className="rounded-none bg-neutral-800 text-white font-black text-sm">
                        {user.profile?.displayName?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1b1b1b] border-neutral-800 text-white">
                  <DropdownMenuItem asChild className="focus:bg-neutral-800 focus:text-white">
                    <Link href={`/users/${user.id}`}>프로필 보기</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-neutral-800 focus:text-white">
                    <Link href="/studio">스튜디오</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-neutral-800 focus:text-white">
                    <Link href="/settings/profile">설정</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem className="text-red-500 focus:text-red-400 focus:bg-neutral-800" onClick={handleLogout}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-white/60 hover:text-white font-bold text-sm uppercase tracking-wider">
                Log in
              </Link>
              <Link href="/sign-up" className="bg-white text-black px-5 py-2 font-black text-xs uppercase tracking-widest hover:bg-neutral-200">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
