"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  portfolioId: string
  initialBookmarked?: boolean
  initialCount?: number
}

interface BookmarkToggleResponse {
  data?: {
    bookmarked?: boolean
    bookmarkCount?: number
  }
}

export function BookmarkButton({
  portfolioId,
  initialBookmarked = false,
  initialCount = 0,
}: BookmarkButtonProps) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (loading) return

    // 낙관적 업데이트
    const next = !bookmarked
    setBookmarked(next)
    setCount((prev) => Math.max(0, prev + (next ? 1 : -1)))
    setLoading(true)

    try {
      const method = next ? "POST" : "DELETE"
      const res = await fetch(`/api/v1/portfolios/${portfolioId}/bookmark`, { method })

      if (res.status === 401) {
        setBookmarked(!next)
        setCount((prev) => Math.max(0, prev + (next ? -1 : 1)))
        toast.error("로그인이 필요합니다.")
        router.push("/sign-in")
        return
      }

      const payload = (await res.json().catch(() => null)) as BookmarkToggleResponse | null

      if (!res.ok) {
        // 실패 시 롤백
        setBookmarked(!next)
        setCount((prev) => Math.max(0, prev + (next ? -1 : 1)))
        return
      }

      if (typeof payload?.data?.bookmarked === "boolean") {
        setBookmarked(payload.data.bookmarked)
      }
      if (typeof payload?.data?.bookmarkCount === "number") {
        setCount(Math.max(0, payload.data.bookmarkCount))
      }
    } catch {
      setBookmarked(!next)
      setCount((prev) => Math.max(0, prev + (next ? -1 : 1)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn("gap-1.5", bookmarked && "text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600")}
      aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
    >
      <Heart
        className={cn("h-4 w-4", bookmarked && "fill-current")}
      />
      <span>{count}</span>
    </Button>
  )
}
