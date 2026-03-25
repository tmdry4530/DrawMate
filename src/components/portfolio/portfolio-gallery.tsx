import Image from "next/image"

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
      <div className="flex justify-center rounded-xl bg-muted overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          width={0}
          height={0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          className="h-auto w-full max-h-[75vh] object-contain"
          priority
        />
      </div>

      {/* 추가 이미지 */}
      {otherImages.length > 0 && (
        <div className="space-y-3">
          {otherImages.map((img, idx) => (
            <div
              key={idx}
              className="flex justify-center rounded-lg bg-muted overflow-hidden"
            >
              <Image
                src={img}
                alt={`${title} 이미지 ${idx + 2}`}
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="h-auto w-full max-h-[75vh] object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
