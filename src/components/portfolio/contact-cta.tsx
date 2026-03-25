"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { unwrapApiData } from "@/lib/utils/client-api"

interface ContactCtaProps {
  targetUserId: string
  className?: string
}

export function ContactCta({ targetUserId, className }: ContactCtaProps) {
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className={cn("gap-2", className)} onClick={handleClick} disabled={loading}>
      <MessageSquare className="h-4 w-4" />
      {loading ? "대화방 여는 중..." : "메시지로 문의하기"}
    </Button>
  )
}
