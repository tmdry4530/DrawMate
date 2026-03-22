"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "@/components/messaging/message-bubble"
import { MessageInput } from "@/components/messaging/message-input"
import { ConversationList } from "@/components/messaging/conversation-list"
import { unwrapApiData } from "@/lib/utils/client-api"

interface Message {
  id: string
  content: string
  imageUrl?: string | null
  createdAt: string
  senderId: string
}

interface MessageApiItem {
  id: string
  body: string | null
  createdAt: string
  senderId: string
  attachments?: { imageUrl?: string | null }[]
}

interface MessagesPage {
  messages: Message[]
  nextCursor: string | null
  currentUserId: string
}

async function fetchMessages(
  conversationId: string,
  cursor: string | null
): Promise<MessagesPage> {
  const params = new URLSearchParams()
  if (cursor) params.set("cursor", cursor)
  const res = await fetch(
    `/api/v1/conversations/${conversationId}/messages?${params.toString()}`
  )
  if (!res.ok) throw new Error("메시지를 불러오는데 실패했습니다")
  const json = await res.json()
  const data = unwrapApiData<{
    items: MessageApiItem[]
    nextCursor: string | null
    currentUserId: string
  }>(json)

  return {
    messages: (data?.items ?? []).map((item) => ({
      id: item.id,
      content: item.body ?? "",
      imageUrl: item.attachments?.[0]?.imageUrl ?? null,
      createdAt: item.createdAt,
      senderId: item.senderId,
    })),
    nextCursor: data?.nextCursor ?? null,
    currentUserId: data?.currentUserId ?? "",
  }
}

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const conversationId = params.conversationId

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor ?? null,
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [data])

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? []
  const currentUserId = data?.pages[0]?.currentUserId ?? ""

  function handleMessageSent() {
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
    queryClient.invalidateQueries({ queryKey: ["conversations"] })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: conversation list (desktop only) */}
      <aside className="hidden md:flex w-80 border-r shrink-0 flex-col">
        <div className="px-4 py-3 border-b">
          <h1 className="text-lg font-semibold">메시지</h1>
        </div>
        <ConversationList activeId={conversationId} />
      </aside>

      {/* Right: message thread */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="메시지 목록으로 돌아가기"
            onClick={() => router.push("/messages")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm">대화</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {hasNextPage && (
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "불러오는 중..." : "이전 메시지 보기"}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              불러오는 중...
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              아직 메시지가 없습니다
            </div>
          ) : (
            allMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === currentUserId}
              />
            ))
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput
          conversationId={conversationId}
          onMessageSent={handleMessageSent}
        />
      </main>
    </div>
  )
}
