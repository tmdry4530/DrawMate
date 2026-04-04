"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bookmark } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  portfolioId: string
  initialBookmarked?: boolean
  initialCount?: number
  className?: string
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
  className,
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
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "h-auto w-full justify-between rounded-none border border-neutral-800 bg-black px-4 py-4 text-white shadow-none cursor-pointer hover:border-white hover:bg-neutral-950 hover:text-white active:scale-[0.98]",
        bookmarked &&
          "border-white text-white hover:border-white hover:text-white",
        className
      )}
      aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
      aria-pressed={bookmarked}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors",
            bookmarked && "bg-white text-black"
          )}
        >
          <Bookmark className={cn("h-5 w-5 shrink-0", bookmarked && "fill-current")} />
        </span>
        <span className="text-sm font-black uppercase tracking-widest text-current">
          {loading ? "처리 중..." : bookmarked ? "저장됨" : "저장하기"}
        </span>
      </span>
      <span className="text-sm font-black tabular-nums text-current">{count}</span>
    </Button>
  )
}
