"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { unwrapApiData } from "@/lib/utils/client-api"

interface ContactCtaProps {
  targetUserId: string
}

export function ContactCta({ targetUserId }: ContactCtaProps) {
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
      if (!res.ok) throw new Error("대화 생성 실패")
      const json = await res.json()
      const data = unwrapApiData<{ conversationId: string }>(json)
      router.push(`/messages/${data.conversationId}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button className="gap-2" onClick={handleClick} disabled={loading}>
      <MessageSquare className="h-4 w-4" />
      {loading ? "연결 중..." : "메시지 보내기"}
    </Button>
  )
}
