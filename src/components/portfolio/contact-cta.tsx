"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { unwrapApiData } from "@/lib/utils/client-api"

interface ContactCtaProps {
  targetUserId: string
  isOwner?: boolean
  className?: string
}

export function ContactCta({ targetUserId, isOwner, className }: ContactCtaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/v1/conversations/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      })
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("로그인이 필요합니다.")
          router.push("/sign-in")
          return
        }
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error?.message ?? "대화 생성 실패")
      }
      const json = await res.json()
      const data = unwrapApiData<{ conversationId: string }>(json)
      router.push(`/messages/${data.conversationId}`)
    } catch (err) {
      toast.error((err as Error).message)
      setLoading(false)
    }
  }

  if (isOwner) {
    return (
      <div className={cn("text-center space-y-2", className)}>
        <button
          disabled
          className="w-full py-4 bg-neutral-900 text-neutral-500 font-black font-headline uppercase tracking-widest border border-neutral-800 flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
        >
          <MessageSquare className="h-4 w-4" />
          내 포트폴리오
        </button>
        <p className="text-xs text-neutral-600 whitespace-pre-wrap">
          자신의 포트폴리오에는{"\n"}메시지를 보낼 수 없습니다.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "w-full py-4 bg-white text-black font-black font-headline uppercase tracking-widest hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2",
        className
      )}
    >
      <MessageSquare className="h-4 w-4" />
      {loading ? "대화방 여는 중..." : "메시지로 문의하기"}
    </button>
  )
}
