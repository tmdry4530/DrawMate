import Link from "next/link"
import Image from "next/image"
import { Bookmark } from "lucide-react"

interface PortfolioCardProps {
  slug: string
  title: string
  thumbnailUrl?: string | null
  ownerName: string
  ownerAvatarUrl?: string | null
  bookmarkCount?: number
  index?: number
}

const ASPECT_RATIOS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[16/9]"]

const CATEGORY_LABELS = [
  "일러스트레이션",
  "UI/UX 디자인",
  "3D 모션",
  "에디토리얼",
  "그래픽 디자인",
  "브랜딩",
]

export function PortfolioCard({
  slug,
  title,
  thumbnailUrl,
  ownerName,
  bookmarkCount = 0,
  index = 0,
}: PortfolioCardProps) {
  const aspectRatio = ASPECT_RATIOS[index % ASPECT_RATIOS.length]
  const categoryLabel = CATEGORY_LABELS[index % CATEGORY_LABELS.length]

  return (
    <Link
      href={`/portfolio/${slug}`}
      className="portfolio-card break-inside-avoid relative group overflow-hidden rounded-xl bg-card mb-8 block"
    >
      <div className={`overflow-hidden rounded-xl ${aspectRatio} relative bg-muted`}>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            이미지 없음
          </div>
        )}

        {/* Hover overlay */}
        <div className="overlay-actions absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 translate-y-4 transition-all duration-300 p-6 flex flex-col justify-end">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">{categoryLabel}</p>
              <h3 className="text-white text-xl font-bold font-headline line-clamp-1">{title}</h3>
              <p className="text-white/90 text-sm italic">by {ownerName}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <span
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-colors"
                aria-label={`북마크 ${bookmarkCount}`}
              >
                <Bookmark className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
