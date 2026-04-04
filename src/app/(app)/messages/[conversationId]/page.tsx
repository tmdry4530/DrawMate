"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { MessageBubble } from "@/components/messaging/message-bubble"
import { MessageInput } from "@/components/messaging/message-input"
import { ConversationList } from "@/components/messaging/conversation-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { unwrapApiData } from "@/lib/utils/client-api"
import { createClient } from "@/lib/supabase/browser-client"

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
  const messagesContainerRef = useRef<HTMLDivElement>(null)
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
    enabled: Boolean(conversationId),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor ?? null,
    retry: (failureCount, queryError) => {
      if (queryError.status >= 400 && queryError.status < 500) {
        return false
      }
      return failureCount < 2
    },
  })
  const { data: conversationMeta } = useQuery({
    queryKey: ["conversation-meta", conversationId],
    queryFn: () => fetchConversationMeta(conversationId),
    staleTime: 30_000,
  })

  // Supabase Realtime + 폴링 폴백 (2초)
  useEffect(() => {
    let realtimeActive = false
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
        }
      )
      .subscribe((status) => {
        realtimeActive = status === "SUBSCRIBED"
      })

    // 폴링 폴백: Realtime 연결 실패 시 2초마다 refetch
    const pollInterval = setInterval(() => {
      if (!realtimeActive) {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
      }
    }, 2000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [data])

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const allMessages = [
    ...(data?.pages.flatMap((p) => p.messages) ?? []).toReversed(),
    ...optimisticMessages,
  ]
  const currentUserId = data?.pages[0]?.currentUserId ?? ""
  const canSendMessage = !isLoading && !isError && Boolean(currentUserId)

  const handleOptimisticMessage = useCallback((msg: { id: string; content: string; senderId: string; createdAt: string }) => {
    setOptimisticMessages((prev) => [...prev, msg])
  }, [])

  const handleMessageSent = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    ])
    setOptimisticMessages([])
  }, [queryClient, conversationId])

  return (
    <div className="flex h-full bg-black">
      {/* Left: conversation list (desktop only) */}
      <aside className="hidden md:flex w-80 lg:w-96 shrink-0 flex-col bg-[#131313] border-r border-white/10">
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-white">메시지</h1>
        </div>
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          <ConversationList activeId={conversationId} />
        </div>
      </aside>

      {/* Right: message thread */}
      <main className="flex flex-col flex-1 min-w-0 bg-black">
        {/* Header */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-[#0d0d0d] border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-8 h-8 text-white/60 hover:text-white transition-colors"
              aria-label="메시지 목록으로 돌아가기"
              onClick={() => router.push("/messages")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {conversationMeta?.peer ? (
              <>
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 rounded-none">
                    <AvatarImage src={conversationMeta.peer.avatarUrl ?? undefined} />
                    <AvatarFallback className="rounded-none bg-[#2a2a2a] text-white font-mono text-xs">
                      {(conversationMeta.peer.displayName ?? "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-black" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-white truncate">
                    {conversationMeta.peer.displayName ?? "알 수 없음"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500" />
                    <span className="font-mono text-[10px] text-green-500 tracking-wider">온라인</span>
                  </div>
                </div>
              </>
            ) : (
              <span className="font-mono text-sm font-bold text-white">대화</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto chat-scrollbar px-6 py-6 space-y-3 flex flex-col justify-end"
        >
          {hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-4 py-1.5 bg-[#1f1f1f] border border-white/10 text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 hover:text-white/60 hover:border-white/20 transition-colors disabled:opacity-30"
              >
                {isFetchingNextPage ? "불러오는 중..." : "이전 메시지 보기"}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full font-mono text-xs text-white/30 tracking-widest uppercase">
              불러오는 중...
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <p className="font-mono text-xs text-white/40">
                {error.status === 403
                  ? "접근 권한이 없는 대화입니다."
                  : error.message}
              </p>
              <button
                type="button"
                onClick={() => router.push("/messages")}
                className="px-4 py-2 bg-[#1f1f1f] border border-white/10 font-mono text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
              >
                대화 목록으로 돌아가기
              </button>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="font-mono text-xs font-bold tracking-widest uppercase text-white/60">아직 메시지가 없습니다</p>
              <p className="font-mono text-[10px] text-white/30">
                첫 문의 내용을 남기면 이 대화방에서 협업을 이어갈 수 있습니다.
              </p>
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
        </div>

        {/* Input */}
        {canSendMessage && (
          <MessageInput
            conversationId={conversationId}
            currentUserId={currentUserId}
            onMessageSent={handleMessageSent}
            onOptimisticMessage={handleOptimisticMessage}
          />
        )}
      </main>
    </div>
  )
}
