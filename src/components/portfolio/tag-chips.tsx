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
      case "field": return "bg-neutral-800 text-white border border-neutral-600"
      case "skill": return "bg-neutral-900 text-purple-400 border border-purple-800"
      case "tool": return "bg-neutral-900 text-cyan-400 border border-cyan-800"
      case "style": return "bg-neutral-900 text-neutral-300 border border-neutral-700"
      default: return "bg-neutral-900 text-neutral-300 border border-neutral-700"
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`px-5 py-2 font-black text-xs uppercase tracking-widest cursor-default ${getCategoryStyle(tag.category)}`}
        >
          {tag.name}
        </span>
      ))}
    </div>
  )
}
