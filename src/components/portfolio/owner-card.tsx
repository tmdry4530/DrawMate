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
    <div className="bg-card p-8 rounded-xl shadow-[0px_24px_48px_rgba(22,29,31,0.06)]">
      <Link href={`/users/${userId}`} className="flex flex-col items-center text-center space-y-4 group">
        <div className="relative">
          <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-primary to-tertiary">
            <Avatar className="w-full h-full border-4 border-white">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black font-headline text-foreground group-hover:underline">{displayName}</h2>
          {headline && (
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">{headline}</p>
          )}
        </div>
      </Link>
    </div>
  )
}
