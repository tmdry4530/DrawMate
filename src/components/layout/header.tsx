"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    if (query) {
      nextParams.set("q", query);
    }

    const nextUrl = nextParams.toString()
      ? `/explore?${nextParams.toString()}`
      : "/explore";

    router.push(nextUrl);
  };

  const isNavActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed top-0 w-full z-50 h-20 bg-white/70 backdrop-blur-xl border-b border-border/40">
      <div className="flex justify-between items-center px-8 h-full w-full mx-auto max-w-screen-2xl">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-0 shrink-0">
            <span className="text-2xl font-black text-primary italic font-headline tracking-tight">
              Draw
            </span>
            <span className="text-2xl font-black italic font-headline tracking-tight bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              Mate
            </span>
          </Link>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className={
                isNavActive("/explore")
                  ? "text-sm font-bold text-primary border-b-2 border-primary pb-1 transition-colors"
                  : "text-sm font-medium text-foreground hover:scale-105 hover:text-primary transition-all duration-200"
              }
            >
              탐색
            </Link>
            <Link
              href="/messages"
              className={
                isNavActive("/messages")
                  ? "text-sm font-bold text-primary border-b-2 border-primary pb-1 transition-colors"
                  : "text-sm font-medium text-foreground hover:scale-105 hover:text-primary transition-all duration-200"
              }
            >
              메시지
            </Link>
            {user && (
              <Link
                href="/studio"
                className={
                  isNavActive("/studio")
                    ? "text-sm font-bold text-primary border-b-2 border-primary pb-1 transition-colors"
                    : "text-sm font-medium text-foreground hover:scale-105 hover:text-primary transition-all duration-200"
                }
              >
                스튜디오
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Search + User actions */}
        <div className="flex items-center gap-3">
          <form
            className="hidden md:flex"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                key={`${pathname}-${searchParams.get("q") ?? ""}`}
                name="q"
                type="search"
                defaultValue={pathname === "/explore" ? searchParams.get("q") ?? "" : ""}
                placeholder="포트폴리오, 분야, 스타일 검색"
                aria-label="포트폴리오, 분야, 스타일, 작가 검색"
                className="w-48 lg:w-64 rounded-full pl-10 pr-4 bg-muted border-border/40 focus-visible:border-primary/40 focus-visible:ring-primary/20 transition-all duration-300"
              />
            </div>
          </form>

          {loading ? (
            <div className="w-20" />
          ) : user ? (
            <>
              {/* Bell icon with dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200" aria-label="알림">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-xs flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="text-sm font-semibold">알림</span>
                    {unreadCount > 0 && (
                      <button type="button" onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                        모두 읽음
                      </button>
                    )}
                  </div>
                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
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

              {/* Avatar + Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0 ml-1 ring-0 hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                    aria-label="프로필 메뉴 열기"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile?.avatarUrl ?? undefined} alt="프로필" />
                      <AvatarFallback>{user.profile?.displayName?.[0] ?? "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${user.id}`}>프로필 보기</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/studio">스튜디오</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">설정</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200" asChild>
                <Link href="/sign-in">로그인</Link>
              </Button>
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/sign-up">시작하기</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
