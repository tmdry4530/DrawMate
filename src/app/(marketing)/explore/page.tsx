"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { useExploreStore } from "@/store/explore-store"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SearchBar } from "@/components/search/search-bar"
import { FilterPanel } from "@/components/search/filter-panel"
import { SortDropdown } from "@/components/search/sort-dropdown"
import { PortfolioGrid } from "@/components/search/portfolio-grid"

type SortOption = "latest" | "popular" | "price_asc" | "price_desc"

function getTagParams(searchParams: URLSearchParams, key: string): string[] {
  return Array.from(new Set([...searchParams.getAll(`${key}[]`), ...searchParams.getAll(key)]))
}

function normalizeSort(value: string | null): SortOption {
  if (value === "latest" || value === "popular" || value === "price_asc" || value === "price_desc") {
    return value
  }
  return "latest"
}

export default function ExplorePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = useExploreStore((s) => s.q)
  const sort = useExploreStore((s) => s.sort)
  const filters = useExploreStore((s) => s.filters)
  const setFilters = useExploreStore((s) => s.setFilters)
  const setQ = useExploreStore((s) => s.setQ)
  const setSort = useExploreStore((s) => s.setSort)

  // URL -> store sync
  useEffect(() => {
    const fieldTags = getTagParams(searchParams, "fieldTags")
    const skillTags = getTagParams(searchParams, "skillTags")
    const toolTags = getTagParams(searchParams, "toolTags")
    const styleTags = getTagParams(searchParams, "styleTags")
    const nextQ = searchParams.get("q") ?? ""
    const nextSort = normalizeSort(searchParams.get("sort"))

    setFilters({ fieldTags, skillTags, toolTags, styleTags })
    setQ(nextQ)
    setSort(nextSort)
  }, [searchParams, setFilters, setQ, setSort])

  // store -> URL sync
  useEffect(() => {
    const nextParams = new URLSearchParams()

    if (q.trim()) nextParams.set("q", q.trim())
    if (sort !== "latest") nextParams.set("sort", sort)
    filters.fieldTags.forEach((tag) => nextParams.append("fieldTags[]", tag))
    filters.skillTags.forEach((tag) => nextParams.append("skillTags[]", tag))
    filters.toolTags.forEach((tag) => nextParams.append("toolTags[]", tag))
    filters.styleTags.forEach((tag) => nextParams.append("styleTags[]", tag))

    const nextQueryString = nextParams.toString()
    const currentQueryString = searchParams.toString()

    if (nextQueryString === currentQueryString) return

    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [
    q,
    sort,
    filters.fieldTags,
    filters.skillTags,
    filters.toolTags,
    filters.styleTags,
    pathname,
    router,
    searchParams,
  ])

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-10">
      {/* 페이지 헤더 */}
      <section className="space-y-3 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          포트폴리오{" "}
          <span className="gradient-text">탐색</span>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base leading-relaxed">
          분야, 스타일, 스킬 태그로 작업자를 찾고 포트폴리오를 확인한 뒤 바로 메시지로 협업을 시작하세요.
        </p>
      </section>

      {/* 검색 영역 */}
      <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <SearchBar />
      </div>

      <div className="flex gap-8">
        {/* 데스크탑 필터 사이드바 */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-20">
            <div className="glass rounded-2xl p-4">
              <FilterPanel />
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center justify-between">
            {/* 모바일 필터 버튼 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" />
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>필터</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>

            <div className="ml-auto">
              <SortDropdown />
            </div>
          </div>

          <div className="stagger-children">
            <PortfolioGrid />
          </div>
        </div>
      </div>
    </div>
  )
}
