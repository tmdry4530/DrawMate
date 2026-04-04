"use client"

import { useQuery } from "@tanstack/react-query"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useExploreStore } from "@/store/explore-store"

interface Tag {
  id: string
  slug: string
  name: string
  category: "field" | "skill" | "tool" | "style"
}

interface TagGroup {
  label: string
  category: keyof ReturnType<typeof useExploreStore.getState>["filters"]
  tags: Tag[]
}

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/v1/tags")
  if (!res.ok) throw new Error("태그를 불러오는데 실패했습니다.")
  const json = await res.json()
  return Array.isArray(json.data) ? json.data : (json.data?.items ?? [])
}

export function FilterPanel() {
  const filters = useExploreStore((s) => s.filters)
  const toggleTag = useExploreStore((s) => s.toggleTag)

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
  })

  const groups: TagGroup[] = [
    {
      label: "분야",
      category: "fieldTags",
      tags: tags.filter((t) => t.category === "field"),
    },
    {
      label: "스킬",
      category: "skillTags",
      tags: tags.filter((t) => t.category === "skill"),
    },
    {
      label: "툴",
      category: "toolTags",
      tags: tags.filter((t) => t.category === "tool"),
    },
    {
      label: "스타일",
      category: "styleTags",
      tags: tags.filter((t) => t.category === "style"),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="space-y-3">
            <Skeleton className="h-4 w-14" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const hasAnyTags = groups.some((group) => group.tags.length > 0)

  return (
    <div className="space-y-6">
      {hasAnyTags && (
        <div className="rounded-none bg-[#1b1b1b] border border-neutral-800 p-4">
          <p className="text-sm font-semibold">필터 사용 팁</p>
          <p className="mt-1 text-sm text-muted-foreground">
            분야와 스타일을 함께 선택하면 원하는 작업자를 더 빠르게 좁힐 수 있습니다.
          </p>
        </div>
      )}

      {groups.map(
        (group) =>
          group.tags.length > 0 && (
            <div key={group.category}>
              <p className="text-sm font-semibold mb-3">{group.label}</p>
              <div className="space-y-2">
                {group.tags.map((tag) => {
                  const isChecked = filters[group.category].includes(tag.slug)
                  const inputId = `filter-${group.category}-${tag.id}`
                  return (
                    <div key={tag.id} className="flex items-center gap-2">
                      <Checkbox
                        id={inputId}
                        checked={isChecked}
                        onCheckedChange={() => toggleTag(group.category, tag.slug)}
                      />
                      <Label htmlFor={inputId} className="text-sm font-normal cursor-pointer">
                        {tag.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>
          )
      )}
    </div>
  )
}
