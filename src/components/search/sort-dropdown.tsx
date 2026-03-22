"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useExploreStore } from "@/store/explore-store"

type SortOption = "latest" | "popular" | "price_asc" | "price_desc"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "price_desc", label: "가격 높은순" },
]

export function SortDropdown() {
  const sort = useExploreStore((s) => s.sort)
  const setSort = useExploreStore((s) => s.setSort)

  return (
    <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
