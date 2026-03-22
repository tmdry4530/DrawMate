"use client"

import { SlidersHorizontal } from "lucide-react"
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

export default function ExplorePage() {
  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* 검색바 */}
      <SearchBar />

      <div className="flex gap-6">
        {/* 데스크탑 필터 사이드바 */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20">
            <FilterPanel />
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0 space-y-4">
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

          <PortfolioGrid />
        </div>
      </div>
    </div>
  )
}
