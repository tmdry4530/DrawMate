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

  const getCategoryStyle = (category?: string | null) => {
    switch (category) {
      case "field": return "bg-secondary-container text-foreground"
      case "skill": return "bg-primary/10 text-primary"
      case "tool": return "bg-tertiary/10 text-tertiary"
      case "style": return "bg-muted text-foreground"
      default: return "bg-muted text-foreground"
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`px-5 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 cursor-default ${getCategoryStyle(tag.category)}`}
        >
          {tag.name}
        </span>
      ))}
    </div>
  )
}
