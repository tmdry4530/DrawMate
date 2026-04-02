"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useExploreStore } from "@/store/explore-store"

export function SearchBar() {
  const setQ = useExploreStore((s) => s.setQ)
  const storeQ = useExploreStore((s) => s.q)
  const [inputValue, setInputValue] = useState(storeQ)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setInputValue(storeQ)
  }, [storeQ])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setQ(inputValue)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [inputValue, setQ])

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="작업명, 분야, 작가 검색"
        aria-label="포트폴리오, 분야, 스타일, 작가 검색"
        className="border-none rounded-full py-2.5 px-6 pr-12 bg-muted focus-visible:ring-2 focus-visible:ring-secondary/20"
      />
      {inputValue ? (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
          onClick={() => {
            setInputValue("")
            setQ("")
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
    </div>
  )
}
