"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "@/components/messaging/message-bubble"
import { MessageInput } from "@/components/messaging/message-input"
import { ConversationList } from "@/components/messaging/conversation-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface ConversationListItem {
  conversationId: string
  peer: {
    id: string
    displayName: string | null
    avatarUrl: string | null
  } | null
}

class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
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
  if (!res.ok) {
    const payload = await res.json().catch(() => null)
    const message = payload?.error?.message ?? "메시지를 불러오는데 실패했습니다"
    throw new ApiRequestError(message, res.status)
  }
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

async function fetchConversationMeta(conversationId: string): Promise<ConversationListItem | null> {
  const res = await fetch("/api/v1/conversations?limit=50")
  if (!res.ok) return null
  const json = await res.json()
  const data = unwrapApiData<{ items: ConversationListItem[] }>(json)
  const items = data?.items ?? []
  return items.find((item) => item.conversationId === conversationId) ?? null
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
    isError,
    error,
  } = useInfiniteQuery<MessagesPage, ApiRequestError>({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => fetchMessages(conversationId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor ?? null,
  })
  const { data: conversationMeta } = useQuery({
    queryKey: ["conversation-meta", conversationId],
    queryFn: () => fetchConversationMeta(conversationId),
    staleTime: 30_000,
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
    queryClient.invalidateQueries({ queryKey: ["conversation-meta", conversationId] })
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
          {conversationMeta?.peer ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={conversationMeta.peer.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {(conversationMeta.peer.displayName ?? "U").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm truncate">
                {conversationMeta.peer.displayName ?? "알 수 없음"}
              </span>
            </div>
          ) : (
            <span className="font-medium text-sm">대화</span>
          )}
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
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                {error.status === 403
                  ? "접근 권한이 없는 대화입니다."
                  : error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/messages")}
              >
                대화 목록으로 돌아가기
              </Button>
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
        {!isError && (
          <MessageInput
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
          />
        )}
      </main>
    </div>
  )
}
