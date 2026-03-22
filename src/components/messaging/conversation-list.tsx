"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

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

async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/v1/conversations")
  if (!res.ok) throw new Error("대화 목록을 불러오는데 실패했습니다")
  return res.json()
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
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="대화 검색..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            대화가 없습니다
          </div>
        ) : (
          <ul>
            {filtered.map((conv) => (
              <li
                key={conv.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors ${
                  activeId === conv.id ? "bg-accent" : ""
                }`}
                onClick={() => router.push(`/messages/${conv.id}`)}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={conv.otherUser.profileImage ?? undefined} />
                  <AvatarFallback>
                    {conv.otherUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {conv.otherUser.name}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage?.content ?? "메시지가 없습니다"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="shrink-0 h-5 min-w-5 text-xs rounded-full px-1.5">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
