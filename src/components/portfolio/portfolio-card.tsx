import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PortfolioCardProps {
  slug: string
  title: string
  thumbnailUrl?: string | null
  ownerName: string
  ownerAvatarUrl?: string | null
  bookmarkCount?: number
}

export function PortfolioCard({
  slug,
  title,
  thumbnailUrl,
  ownerName,
  ownerAvatarUrl,
  bookmarkCount = 0,
}: PortfolioCardProps) {
  const initials = ownerName.slice(0, 2).toUpperCase()

  return (
    <Link href={`/portfolio/${slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        {/* 썸네일 */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              이미지 없음
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <p className="font-medium text-sm line-clamp-2 leading-snug">{title}</p>

          <div className="flex items-center justify-between">
            {/* 작가 정보 */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar size="sm">
                <AvatarImage src={ownerAvatarUrl ?? undefined} alt={ownerName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
            </div>

            {/* 북마크 수 */}
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
              <Heart className="h-3 w-3" />
              <span>{bookmarkCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
