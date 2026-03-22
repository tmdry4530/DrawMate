"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PortfolioCard } from "@/components/portfolio/portfolio-card"

interface BookmarkedPortfolio {
  id: string
  slug: string
  title: string
  thumbnailUrl?: string | null
  ownerName: string
  ownerAvatarUrl?: string | null
  bookmarkCount: number
}

function PortfolioCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export default function BookmarksPage() {
  const [portfolios, setPortfolios] = useState<BookmarkedPortfolio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/v1/bookmarks")
        if (res.ok) {
          const data = await res.json()
          setPortfolios(data ?? [])
        }
      } catch {
        // 에러 시 빈 목록 유지
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarks()
  }, [])

  return (
    <div className="container max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">북마크</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PortfolioCardSkeleton key={i} />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          아직 북마크한 포트폴리오가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              slug={portfolio.slug}
              title={portfolio.title}
              thumbnailUrl={portfolio.thumbnailUrl}
              ownerName={portfolio.ownerName}
              ownerAvatarUrl={portfolio.ownerAvatarUrl}
              bookmarkCount={portfolio.bookmarkCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
