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
import { createClient } from "@/lib/supabase/browser-client";
import { unwrapApiData } from "@/lib/utils/client-api";

interface UserProfile {
  displayName: string | null;
  avatarUrl: string | null;
}

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string; profile?: UserProfile } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const loadUnreadCount = async () => {
      try {
        const res = await fetch("/api/v1/notifications?limit=1&unreadOnly=true");
        if (!res.ok || !mounted) return;
        const json = await res.json();
        const data = unwrapApiData<{ unreadCount?: number }>(json);
        setUnreadCount(data?.unreadCount ?? 0);
      } catch {
        // keep header usable even when unread fetch fails
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
        await loadUnreadCount();
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
    router.push("/sign-in");
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

  return (
    <header className="animate-fade-down sticky top-0 z-50 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0 text-xl font-medium text-foreground shrink-0">
          <span>Draw</span><span className="font-bold gradient-text">Mate</span>
        </Link>

        {/* Search - desktop only */}
        <form
          className="mx-8 hidden max-w-md flex-1 md:flex"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              key={`${pathname}-${searchParams.get("q") ?? ""}`}
              name="q"
              type="search"
              defaultValue={pathname === "/explore" ? searchParams.get("q") ?? "" : ""}
              placeholder="포트폴리오, 분야, 스타일, 작가를 검색하세요"
              aria-label="포트폴리오, 분야, 스타일, 작가 검색"
              className="w-full rounded-full pl-10 pr-4 glass border-border/40 focus-visible:border-primary/40 focus-visible:ring-primary/20 transition-all duration-200"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {loading ? (
            <div className="w-20" />
          ) : user ? (
            <>
              <Button variant="ghost" className="hidden lg:inline-flex rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200" asChild>
                <Link href="/studio">스튜디오</Link>
              </Button>

              {/* Bell icon with badge */}
              <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200" asChild>
                <Link href="/notifications" aria-label="알림 페이지로 이동">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-xs flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Messages icon */}
              <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200" asChild>
                <Link href="/messages" aria-label="메시지 페이지로 이동">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>

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
                    <Link href="/settings/profile">프로필 보기</Link>
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
              <Button className="rounded-full" asChild>
                <Link href="/sign-up">시작하기</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Gradient bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </header>
  );
}
