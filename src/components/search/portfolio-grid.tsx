"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useExploreStore } from "@/store/explore-store"
import { Loader2 } from "lucide-react"

interface PortfolioItem {
  id: string
  slug: string
  title: string
  thumbnailUrl?: string | null
  bookmarkCount?: number
  profiles?: {
    displayName: string
    avatarUrl?: string | null
  } | null
}

interface PageData {
  items: PortfolioItem[]
  nextCursor: string | null
  hasMore: boolean
}

async function fetchPortfolios({
  pageParam,
  q,
  sort,
  fieldTags,
  skillTags,
  toolTags,
  styleTags,
}: {
  pageParam: string | null
  q: string
  sort: string
  fieldTags: string[]
  skillTags: string[]
  toolTags: string[]
  styleTags: string[]
}): Promise<PageData> {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (sort) params.set("sort", sort)
  if (pageParam) params.set("cursor", pageParam)
  fieldTags.forEach((t) => params.append("fieldTags[]", t))
  skillTags.forEach((t) => params.append("skillTags[]", t))
  toolTags.forEach((t) => params.append("toolTags[]", t))
  styleTags.forEach((t) => params.append("styleTags[]", t))

  const res = await fetch(`/api/v1/portfolios?${params.toString()}`)
  if (!res.ok) throw new Error("포트폴리오를 불러오는데 실패했습니다.")
  const json = await res.json()
  return json.data
}

function PortfolioCardSkeleton({ index }: { index: number }) {
  const aspects = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[16/9]"]
  const aspect = aspects[index % aspects.length]
  return (
    <div className="break-inside-avoid mb-8">
      <Skeleton className={`${aspect} w-full rounded-xl`} />
    </div>
  )
}

export function PortfolioGrid() {
  const q = useExploreStore((s) => s.q)
  const sort = useExploreStore((s) => s.sort)
  const filters = useExploreStore((s) => s.filters)
  const reset = useExploreStore((s) => s.reset)

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["portfolios", q, sort, filters],
    queryFn: ({ pageParam }) =>
      fetchPortfolios({
        pageParam: pageParam as string | null,
        q,
        sort,
        fieldTags: filters.fieldTags,
        skillTags: filters.skillTags,
        toolTags: filters.toolTags,
        styleTags: filters.styleTags,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor ?? null,
  })

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allItems = data?.pages.flatMap((p) => p.items) ?? []
  const hasActiveFilters =
    q.trim().length > 0 ||
    filters.fieldTags.length > 0 ||
    filters.skillTags.length > 0 ||
    filters.toolTags.length > 0 ||
    filters.styleTags.length > 0

  if (isLoading) {
    return (
      <div className="asymmetric-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <PortfolioCardSkeleton key={i} index={i} />
        ))}
      </div>
    )
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-2xl bg-muted px-6 py-16 text-center">
        <p className="text-lg font-semibold">조건에 맞는 포트폴리오를 찾지 못했어요</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {hasActiveFilters
            ? "검색어나 필터를 조정해보세요. 그래도 없다면 직접 포트폴리오를 등록해 협업 요청을 받아볼 수 있습니다."
            : "아직 공개된 포트폴리오가 많지 않습니다. 원하는 작업을 찾지 못했다면 직접 포트폴리오를 등록해보세요."}
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          {hasActiveFilters && (
            <Button variant="outline" onClick={() => reset()} className="rounded-full border-none bg-muted">
              조건 초기화
            </Button>
          )}
          <Button asChild>
            <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isFetching && !isFetchingNextPage && !isLoading && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>결과 업데이트 중...</span>
        </div>
      )}
      <div className="asymmetric-grid">
        {allItems.map((p, i) => (
          <PortfolioCard
            key={p.id}
            index={i}
            slug={p.slug}
            title={p.title}
            thumbnailUrl={p.thumbnailUrl}
            ownerName={p.profiles?.displayName ?? "알 수 없음"}
            ownerAvatarUrl={p.profiles?.avatarUrl}
            bookmarkCount={p.bookmarkCount}
          />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="asymmetric-grid mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <PortfolioCardSkeleton key={i} index={allItems.length + i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  )
}
