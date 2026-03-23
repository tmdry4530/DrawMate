import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import { createClient } from "@/lib/supabase/server-client"

interface PortfolioRow {
  id: string
  slug: string
  title: string
  bookmark_count: number
  owner: {
    id: string
    display_name: string | null
    avatar_path: string | null
  } | null
  cover_image:
    | {
        thumb_path: string | null
        display_path: string | null
        original_path: string | null
        is_cover: boolean
        sort_order: number
      }
    | {
        thumb_path: string | null
        display_path: string | null
        original_path: string | null
        is_cover: boolean
        sort_order: number
      }[]
    | null
}

interface CoverImageRow {
    thumb_path: string | null
    display_path: string | null
    original_path: string | null
    is_cover: boolean
    sort_order: number
}

interface TagRow {
  id: string
  slug: string
  name: string
  category: string
}

async function getRecentPortfolios(): Promise<PortfolioRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("portfolios")
    .select(
      `id, slug, title, bookmark_count,
       owner:profiles!owner_id(id, display_name, avatar_path),
       cover_image:portfolio_images(thumb_path, display_path, original_path, is_cover, sort_order)`
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(8)

  const rows = (data ?? []) as unknown as PortfolioRow[]
  return rows.map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner
    const rawCoverImages = Array.isArray(row.cover_image)
      ? row.cover_image
      : row.cover_image
        ? [row.cover_image]
        : []
    const orderedCoverImages = [...rawCoverImages].sort(
      (a: CoverImageRow, b: CoverImageRow) => a.sort_order - b.sort_order
    )
    const selectedCoverImage =
      orderedCoverImages.find((image) => image.is_cover) ?? orderedCoverImages[0] ?? null

    const avatarPath = owner?.avatar_path ?? null
    const publicPath =
      selectedCoverImage?.thumb_path ??
      selectedCoverImage?.display_path ??
      selectedCoverImage?.original_path ??
      null

    const avatarUrl = avatarPath
      ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl
      : null
    const thumbUrl = publicPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(publicPath).data.publicUrl
      : null

    return {
      ...row,
      owner: owner
        ? {
            ...owner,
            avatar_path: avatarUrl,
          }
        : null,
      cover_image: selectedCoverImage
        ? {
            ...selectedCoverImage,
            thumb_path: thumbUrl,
          }
        : null,
    }
  })
}

async function getPopularTags(): Promise<TagRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tags")
    .select("id, slug, name, category")
    .eq("category", "field")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(12)

  return (data ?? []) as TagRow[]
}

function TagSection({ tags }: { tags: TagRow[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link key={tag.id} href={`/explore?fieldTags[]=${tag.slug}`}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
            {tag.name}
          </Badge>
        </Link>
      ))}
    </div>
  )
}

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()])

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-12">
      {/* 히어로 섹션 */}
      <section className="text-center space-y-6 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          창작의 파트너를 찾아보세요
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
          웹툰, 일러스트, 애니메이션 분야의 전문 어시스턴트와 연결하세요
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/explore">탐색 시작</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
          </Button>
        </div>
      </section>

      {/* 데스크탑: 2컬럼 (그리드 + 사이드바), 모바일: 단일 컬럼 */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* 최신 포트폴리오 */}
        <section className="flex-1 min-w-0 space-y-4">
          <h2 className="text-xl font-semibold">최신 포트폴리오</h2>
          {portfolios.length === 0 ? (
            <p className="text-muted-foreground text-sm">아직 등록된 포트폴리오가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((p) => {
                const owner = Array.isArray(p.owner) ? p.owner[0] : p.owner
                const coverImage = Array.isArray(p.cover_image) ? p.cover_image[0] : p.cover_image
                return (
                  <PortfolioCard
                    key={p.id}
                    slug={p.slug}
                    title={p.title}
                    thumbnailUrl={coverImage?.thumb_path ?? null}
                    ownerName={owner?.display_name ?? "익명"}
                    ownerAvatarUrl={owner?.avatar_path ?? null}
                    bookmarkCount={p.bookmark_count}
                  />
                )
              })}
            </div>
          )}
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/explore">더 보기</Link>
            </Button>
          </div>
        </section>

        {/* 인기 태그 사이드바 (데스크탑) / 수평 스크롤 (모바일) */}
        <aside className="md:w-56 shrink-0 space-y-4">
          <h2 className="text-xl font-semibold">인기 태그</h2>
          {/* 모바일: 수평 스크롤 */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/explore?fieldTags[]=${tag.slug}`} className="shrink-0">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors whitespace-nowrap">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
          {/* 데스크탑: 세로 배치 */}
          <div className="hidden md:block">
            <TagSection tags={tags} />
          </div>
        </aside>
      </div>
    </div>
  )
}
