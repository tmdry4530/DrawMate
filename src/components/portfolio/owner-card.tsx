import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OwnerCardProps {
  userId: string
  displayName: string
  headline?: string | null
  avatarUrl?: string | null
}

export function OwnerCard({ userId, displayName, headline, avatarUrl }: OwnerCardProps) {
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <Link href={`/users/${userId}`} className="flex items-center gap-3 group">
      <Avatar size="lg">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm group-hover:underline truncate">{displayName}</p>
        {headline && (
          <p className="text-xs text-muted-foreground truncate">{headline}</p>
        )}
      </div>
    </Link>
  )
}
