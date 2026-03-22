"use client"

import { useQuery } from "@tanstack/react-query"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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

  const { data: tags = [] } = useQuery<Tag[]>({
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

  return (
    <div className="space-y-6">
      {/* 작업 가능 토글 — 추후 활성화 예정 */}
      <div className="flex items-center gap-2 opacity-40 cursor-not-allowed select-none">
        <Checkbox id="available" disabled />
        <Label htmlFor="available" className="text-sm font-normal">
          작업 가능한 작가만
        </Label>
      </div>

      {groups.map(
        (group) =>
          group.tags.length > 0 && (
            <div key={group.category}>
              <p className="text-sm font-semibold mb-3">{group.label}</p>
              <div className="space-y-2">
                {group.tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`${group.category}-${tag.slug}`}
                      checked={filters[group.category].includes(tag.slug)}
                      onCheckedChange={() => toggleTag(group.category, tag.slug)}
                    />
                    <Label
                      htmlFor={`${group.category}-${tag.slug}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  )
}
