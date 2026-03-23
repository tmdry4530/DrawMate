import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
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
    <Link href={`/portfolio/${slug}`} className="group block">
      <div className="hover-lift glow rounded-2xl overflow-hidden bg-card border border-border/50 transition-colors duration-300">
        {/* 썸네일 */}
        <div className="image-reveal relative aspect-[4/3] bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              이미지 없음
            </div>
          )}

          {/* 하단 그라디언트 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* 호버시 제목 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <p className="text-white text-xs font-medium line-clamp-2 leading-snug drop-shadow-sm">
              {title}
            </p>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4">
          <p className="font-semibold text-sm truncate leading-snug mb-3">{title}</p>

          <div className="flex items-center justify-between">
            {/* 작가 정보 */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="ring-1 ring-transparent group-hover:ring-primary/40 rounded-full transition-all duration-300">
                <Avatar size="sm">
                  <AvatarImage src={ownerAvatarUrl ?? undefined} alt={ownerName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
            </div>

            {/* 북마크 수 */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 group-hover:text-primary/70 transition-colors duration-300">
              <Heart className="h-3.5 w-3.5 group-hover:fill-primary/40 transition-all duration-300" />
              <span>{bookmarkCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
