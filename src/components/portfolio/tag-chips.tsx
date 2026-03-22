import { Badge } from "@/components/ui/badge"

interface Tag {
  id: string
  name: string
  category?: string | null
}

interface TagChipsProps {
  tags: Tag[]
}

export function TagChips({ tags }: TagChipsProps) {
  if (tags.length === 0) return null

  // 카테고리별로 그룹화
  const grouped = tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const key = tag.category ?? "기타"
    if (!acc[key]) acc[key] = []
    acc[key].push(tag)
    return acc
  }, {})

  const hasCategories = Object.keys(grouped).length > 1 || !grouped["기타"]

  if (!hasCategories) {
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category}>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">{category}</p>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
