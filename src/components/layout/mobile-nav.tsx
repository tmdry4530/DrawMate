"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/explore", icon: Search, label: "탐색" },
  { href: "/studio/portfolios/new", icon: PlusCircle, label: "포트폴리오 등록" },
  { href: "/messages", icon: MessageSquare, label: "메시지" },
  { href: "/settings/profile", icon: User, label: "프로필" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-800 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 text-center text-[11px] leading-tight transition-all duration-200 rounded-none",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-none bg-primary/10" />
              )}
              <Icon
                className={cn(
                  "relative z-10 transition-all duration-200",
                  isActive ? "h-5.5 w-5.5 stroke-[2.5]" : "h-5 w-5"
                )}
              />
              <span className={cn("relative z-10 transition-all duration-200", isActive ? "font-medium" : "")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
