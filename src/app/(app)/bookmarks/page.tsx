"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import { unwrapApiData } from "@/lib/utils/client-api"

interface BookmarkedPortfolio {
  id: string
  slug: string
  title: string
  thumbnailUrl?: string | null
  ownerName: string
  ownerAvatarUrl?: string | null
  bookmarkCount: number
}

interface BookmarkApiItem {
  id: string
  portfolio: {
    id: string
    slug: string
    title: string
    thumbnailUrl?: string | null
    bookmarkCount: number
    profiles?: {
      displayName?: string | null
      avatarUrl?: string | null
      avatarPath?: string | null
    } | null
  } | null
}

function PortfolioCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-video w-full rounded-none bg-neutral-800" />
      <Skeleton className="h-4 w-3/4 rounded-none bg-neutral-800" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-none bg-neutral-800" />
        <Skeleton className="h-3 w-20 rounded-none bg-neutral-800" />
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
          const json = await res.json()
          const data = unwrapApiData<{ items: BookmarkApiItem[] }>(json)
          const mapped = (data?.items ?? [])
            .filter((item) => !!item.portfolio)
            .map((item) => ({
              id: item.portfolio!.id,
              slug: item.portfolio!.slug,
              title: item.portfolio!.title,
              thumbnailUrl: item.portfolio!.thumbnailUrl ?? null,
              ownerName: item.portfolio!.profiles?.displayName ?? "알 수 없음",
              ownerAvatarUrl:
                item.portfolio!.profiles?.avatarUrl ??
                item.portfolio!.profiles?.avatarPath ??
                null,
              bookmarkCount: item.portfolio!.bookmarkCount ?? 0,
            }))
          setPortfolios(mapped)
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
    <div className="bg-black text-white min-h-screen -mt-20 pt-20">
      <div className="container max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-6">북마크</h1>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PortfolioCardSkeleton key={i} />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="py-24 text-center text-neutral-500">
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
    </div>
  )
}
