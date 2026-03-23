import Link from "next/link"
import { ArrowRight, MessageSquare, PenTool, SearchCheck } from "lucide-react"
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

const featureCards = [
  {
    title: "작가와 어시스턴트 연결",
    description: "웹툰, 일러스트, 애니메이션 작업에 맞는 협업 파트너를 포트폴리오로 빠르게 찾을 수 있습니다.",
    icon: SearchCheck,
  },
  {
    title: "포트폴리오 중심 탐색",
    description: "분야, 스킬, 툴, 스타일 태그로 조건을 좁히고 실제 작업 결과물을 먼저 확인합니다.",
    icon: PenTool,
  },
  {
    title: "메시지로 바로 협업 문의",
    description: "포트폴리오를 본 뒤 메시지를 보내면 바로 1:1 대화가 시작되어 다음 단계가 끊기지 않습니다.",
    icon: MessageSquare,
  },
]

const onboardingSteps = [
  {
    title: "포트폴리오 탐색",
    description: "분야와 스타일을 기준으로 작업자를 둘러보세요.",
  },
  {
    title: "포트폴리오 등록",
    description: "내 작업을 등록해 협업 요청을 받을 준비를 하세요.",
  },
  {
    title: "메시지로 협의",
    description: "원하는 상대를 찾으면 바로 일정과 범위를 논의할 수 있습니다.",
  },
]

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()])

  return (
    <div className="mx-auto max-w-7xl py-10 space-y-12">
      <section className="rounded-3xl border bg-gradient-to-b from-muted/50 via-background to-background px-6 py-12 text-center md:px-10 md:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6">
          <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
            작가-어시스턴트 협업 플랫폼
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight leading-tight md:text-5xl">
            웹툰·일러스트 작업에 맞는
            <br className="hidden sm:block" /> 작가와 어시스턴트를 연결합니다
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            포트폴리오 탐색, 메시지, 협업 문의까지 한곳에서 이어지는 창작 매칭 경험을 제공합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["웹툰", "일러스트", "애니메이션", "배경", "채색", "캐릭터 디자인"].map((label) => (
              <Badge key={label} variant="outline" className="rounded-full">
                {label}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-44">
              <Link href="/explore">탐색 시작</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="min-w-44 text-muted-foreground hover:text-foreground">
              <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureCards.map(({ title, description, icon: Icon }) => (
          <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">최신 포트폴리오</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                실제 작업 스타일을 확인하고 바로 협업 문의로 이어가세요.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/explore">
                전체 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {portfolios.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
              <p className="text-lg font-semibold">아직 공개된 포트폴리오가 많지 않아요</p>
              <p className="mt-2 text-sm text-muted-foreground">
                첫 번째 포트폴리오를 등록하거나 탐색에서 조건을 넓혀 새 협업 파트너를 찾아보세요.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/explore">탐색으로 이동</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="pt-2 sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/explore">전체 보기</Link>
            </Button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-semibold">인기 태그</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              자주 찾는 작업 분야부터 바로 탐색할 수 있습니다.
            </p>
            <div className="mt-4">
              <TagSection tags={tags} />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-semibold">이렇게 시작하세요</h2>
            <div className="mt-4 space-y-4">
              {onboardingSteps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
