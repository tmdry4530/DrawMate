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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="포트폴리오 검색..."
        className="pl-9 pr-9"
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => {
            setInputValue("")
            setQ("")
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
