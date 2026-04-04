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
    <div className="bg-black p-8 border border-neutral-800">
      <Link href={`/users/${userId}`} className="flex flex-col items-center text-center space-y-4 group">
        <div className="w-24 h-24 border border-neutral-700">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="rounded-none text-lg font-black bg-neutral-900 text-white">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white group-hover:underline underline-offset-4">{displayName}</h2>
          {headline && (
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider">{headline}</p>
          )}
        </div>
      </Link>
    </div>
  )
}
