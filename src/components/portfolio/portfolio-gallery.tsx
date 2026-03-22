import Image from "next/image"
import { cn } from "@/lib/utils"

interface PortfolioGalleryProps {
  coverImage: string
  images: string[]
  title: string
}

export function PortfolioGallery({ coverImage, images, title }: PortfolioGalleryProps) {
  const otherImages = images.filter((img) => img !== coverImage)

  return (
    <div className="space-y-3">
      {/* 커버 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        />
      </div>

      {/* 추가 이미지 그리드 */}
      {otherImages.length > 0 && (
        <div
          className={cn(
            "grid gap-2",
            otherImages.length === 1 && "grid-cols-1",
            otherImages.length === 2 && "grid-cols-2",
            otherImages.length >= 3 && "grid-cols-3"
          )}
        >
          {otherImages.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <Image
                src={img}
                alt={`${title} 이미지 ${idx + 2}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
