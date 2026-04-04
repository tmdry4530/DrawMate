import Image from "next/image"

interface PortfolioGalleryProps {
  coverImage: string
  images: string[]
  title: string
}

export function PortfolioGallery({ coverImage, images, title }: PortfolioGalleryProps) {
  const otherImages = images.filter((img) => img !== coverImage)

  return (
    <section className="space-y-6">
      {/* Main hero image */}
      <div className="relative group aspect-[16/10] overflow-hidden bg-neutral-900">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1200px) 100vw, 1200px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Asymmetric sub-images */}
      {otherImages.length >= 2 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="relative aspect-square overflow-hidden bg-neutral-900 translate-y-4">
            <Image
              src={otherImages[0]}
              alt={`${title} 이미지 2`}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="relative aspect-square overflow-hidden bg-neutral-900 -translate-y-4">
            <Image
              src={otherImages[1]}
              alt={`${title} 이미지 3`}
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
        </div>
      )}

      {/* If only 1 other image */}
      {otherImages.length === 1 && (
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900">
          <Image
            src={otherImages[0]}
            alt={`${title} 이미지 2`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      {/* Remaining images as panoramic strips */}
      {otherImages.slice(2).map((img, idx) => (
        <div key={idx} className="relative aspect-[16/6] overflow-hidden bg-neutral-900 mt-8">
          <Image
            src={img}
            alt={`${title} 이미지 ${idx + 4}`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}
    </section>
  )
}
