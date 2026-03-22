import type { Metadata } from "next"
import { Clock, DollarSign } from "lucide-react"
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery"
import { OwnerCard } from "@/components/portfolio/owner-card"
import { TagChips } from "@/components/portfolio/tag-chips"
import { BookmarkButton } from "@/components/portfolio/bookmark-button"
import { ContactCta } from "@/components/portfolio/contact-cta"

interface Props {
  params: Promise<{ portfolioSlug: string }>
}

// 목업 데이터 (API 준비 전)
const MOCK_PORTFOLIO = {
  id: "mock-portfolio-1",
  slug: "fantasy-character-design",
  title: "판타지 캐릭터 디자인 패키지",
  description:
    "독창적인 판타지 세계관 기반의 캐릭터 디자인을 제공합니다. RPG, 소설, 웹툰 등 다양한 용도로 활용 가능한 고퀄리티 캐릭터 일러스트레이션입니다. 개인 맞춤 설정이 가능하며, 납품 후 수정 2회가 포함됩니다.",
  coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
  images: [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
  ],
  priceMin: 150000,
  priceMax: 500000,
  durationDays: 14,
  bookmarkCount: 42,
  tags: [
    { id: "1", name: "캐릭터 디자인", category: "스타일" },
    { id: "2", name: "판타지", category: "장르" },
    { id: "3", name: "RPG", category: "장르" },
    { id: "4", name: "디지털 일러스트", category: "기법" },
    { id: "5", name: "상업용", category: "용도" },
  ],
  owner: {
    id: "mock-user-1",
    displayName: "아트마스터",
    headline: "10년 경력 캐릭터 디자이너",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80",
  },
}

function formatPrice(min: number, max: number): string {
  const fmt = (n: number) => n.toLocaleString("ko-KR")
  if (min === max) return `${fmt(min)}원`
  return `${fmt(min)}원 ~ ${fmt(max)}원`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { portfolioSlug } = await params
  // API 준비 후 실제 데이터로 교체
  const portfolio = portfolioSlug === MOCK_PORTFOLIO.slug ? MOCK_PORTFOLIO : MOCK_PORTFOLIO

  return {
    title: `${portfolio.title} | DrawMate`,
    description: portfolio.description.slice(0, 160),
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  await params
  // API 준비 후 실제 데이터 fetch로 교체
  const portfolio = MOCK_PORTFOLIO

  return (
    <div className="container max-w-3xl px-4 py-8 space-y-8">
      {/* 작가 카드 */}
      <OwnerCard
        userId={portfolio.owner.id}
        displayName={portfolio.owner.displayName}
        headline={portfolio.owner.headline}
        avatarUrl={portfolio.owner.avatarUrl}
      />

      {/* 제목 */}
      <h1 className="text-2xl font-bold leading-snug">{portfolio.title}</h1>

      {/* 이미지 갤러리 */}
      <PortfolioGallery
        coverImage={portfolio.coverImage}
        images={portfolio.images}
        title={portfolio.title}
      />

      {/* 설명 */}
      <section>
        <h2 className="text-base font-semibold mb-2">작품 소개</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {portfolio.description}
        </p>
      </section>

      {/* 태그 */}
      <section>
        <h2 className="text-base font-semibold mb-2">태그</h2>
        <TagChips tags={portfolio.tags} />
      </section>

      {/* 가격 / 기간 */}
      <section className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">가격</span>
          <span className="font-semibold">
            {formatPrice(portfolio.priceMin, portfolio.priceMax)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">납기</span>
          <span className="font-semibold">{portfolio.durationDays}일</span>
        </div>
      </section>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <BookmarkButton
          portfolioId={portfolio.id}
          initialBookmarked={false}
          initialCount={portfolio.bookmarkCount}
        />
        <ContactCta targetUserId={portfolio.owner.id} />
      </div>
    </div>
  )
}
