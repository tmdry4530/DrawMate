"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { unwrapApiData } from "@/lib/utils/client-api"

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string
    profileImage: string | null
  }
  lastMessage: {
    content: string
    createdAt: string
  } | null
  unreadCount: number
}

interface ConversationApiItem {
  conversationId: string
  lastMessageSnippet: string | null
  lastMessageAt: string | null
  unreadCount: number
  peer: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  } | null
}

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/v1/conversations")
  if (!res.ok) throw new Error("대화 목록을 불러오는데 실패했습니다")
  const json = await res.json()
  const data = unwrapApiData<{ items: ConversationApiItem[] }>(json)
  const items = data?.items ?? []

  return items.map((item) => ({
    id: item.conversationId,
    otherUser: {
      id: item.peer?.id ?? "unknown",
      name: item.peer?.displayName ?? "알 수 없음",
      profileImage: item.peer?.avatarUrl ?? null,
    },
    lastMessage: item.lastMessageAt
      ? {
          content: item.lastMessageSnippet ?? "",
          createdAt: item.lastMessageAt,
        }
      : null,
    unreadCount: item.unreadCount ?? 0,
  }))
}

export function ConversationList({ activeId }: { activeId?: string }) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  })

  const filtered = conversations.filter((c) =>
    c.otherUser.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="대화 검색..."
            className="w-full rounded-2xl bg-muted border-none py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <p className="text-sm font-headline font-semibold">아직 대화가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              포트폴리오 상세에서 메시지를 보내면 여기서 바로 이어집니다.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/explore">포트폴리오 탐색</Link>
            </Button>
          </div>
        ) : (
          <ul className="px-4">
            {filtered.map((conv) => {
              const isActive = activeId === conv.id
              return (
                <li key={conv.id} className="mb-2">
                  <button
                    type="button"
                    aria-label={`${conv.otherUser.name} 대화 열기`}
                    className={`flex w-full items-center gap-3 p-4 rounded-3xl transition-all text-left ${
                      isActive
                        ? "bg-card shadow-sm border border-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => router.push(`/messages/${conv.id}`)}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-14 w-14 rounded-2xl">
                        <AvatarImage
                          src={conv.otherUser.profileImage ?? undefined}
                          className="rounded-2xl object-cover"
                        />
                        <AvatarFallback className="rounded-2xl text-base font-bold">
                          {conv.otherUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-headline font-bold text-foreground text-sm truncate">
                          {conv.otherUser.name}
                        </span>
                        {conv.lastMessage && (
                          <span
                            className={`text-[10px] font-bold shrink-0 ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                              addSuffix: false,
                              locale: ko,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm truncate ${
                            conv.unreadCount > 0
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conv.lastMessage?.content ?? "메시지가 없습니다"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 w-5 h-5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
