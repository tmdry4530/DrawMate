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
import { PortfolioGrid } from "@/components/search/portfolio-grid"
import { cn } from "@/lib/utils"

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

const FILTER_PILLS = [
  { label: "All Works", fieldTag: null },
  { label: "일러스트레이션", fieldTag: "일러스트레이션" },
  { label: "UI/UX 디자인", fieldTag: "ui-ux" },
  { label: "3D 모션", fieldTag: "3d-모션" },
  { label: "에디토리얼", fieldTag: "에디토리얼" },
]

export default function ExplorePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const q = useExploreStore((s) => s.q)
  const sort = useExploreStore((s) => s.sort)
  const filters = useExploreStore((s) => s.filters)
  const setFilters = useExploreStore((s) => s.setFilters)
  const setQ = useExploreStore((s) => s.setQ)
  const setSort = useExploreStore((s) => s.setSort)
  const reset = useExploreStore((s) => s.reset)

  // URL -> store sync
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString)
    const fieldTags = getTagParams(params, "fieldTags")
    const skillTags = getTagParams(params, "skillTags")
    const toolTags = getTagParams(params, "toolTags")
    const styleTags = getTagParams(params, "styleTags")
    const nextQ = params.get("q") ?? ""
    const nextSort = normalizeSort(params.get("sort"))

    setFilters({ fieldTags, skillTags, toolTags, styleTags })
    setQ(nextQ)
    setSort(nextSort)
  }, [searchParamsString, setFilters, setQ, setSort])

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
    const currentQueryString = searchParamsString

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
    searchParamsString,
  ])

  function handlePillClick(fieldTag: string | null) {
    if (fieldTag === null) {
      reset()
    } else {
      setFilters({
        fieldTags: [fieldTag],
        skillTags: [],
        toolTags: [],
        styleTags: [],
      })
    }
  }

  const activePill =
    filters.fieldTags.length === 1 &&
    filters.skillTags.length === 0 &&
    filters.toolTags.length === 0 &&
    filters.styleTags.length === 0
      ? filters.fieldTags[0]
      : null

  const isAllActive =
    filters.fieldTags.length === 0 &&
    filters.skillTags.length === 0 &&
    filters.toolTags.length === 0 &&
    filters.styleTags.length === 0 &&
    !q.trim()

  return (
    <div className="bg-black text-white -mt-20 pt-20 min-h-screen">
      <div className="pb-20 px-6 max-w-screen-2xl mx-auto">
        {/* Hero */}
        <section className="pt-12 mb-12 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="font-mono text-neutral-500 text-xs tracking-widest uppercase mb-3">
                Curated Selection
              </p>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
                Discover the{" "}
                <span className="text-neutral-400">Moving Mind.</span>
              </h1>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {FILTER_PILLS.map((pill) => {
                const isActive =
                  pill.fieldTag === null ? isAllActive : activePill === pill.fieldTag
                return (
                  <button
                    key={pill.label}
                    onClick={() => handlePillClick(pill.fieldTag)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-mono font-medium uppercase tracking-wider transition-colors duration-150",
                      isActive
                        ? "bg-white text-black border border-white"
                        : "bg-transparent text-neutral-400 border border-neutral-800 hover:border-white hover:text-white"
                    )}
                  >
                    {pill.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Search + Mobile Filter */}
        <section className="mb-10 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0 rounded-none border-neutral-800 bg-transparent text-neutral-400 hover:border-white hover:text-white hover:bg-transparent font-mono text-xs uppercase tracking-wider"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto px-6 pt-8 bg-black border-neutral-800 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white font-mono uppercase tracking-wider">필터</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </section>

        {/* Grid */}
        <PortfolioGrid />
      </div>
    </div>
  )
}
