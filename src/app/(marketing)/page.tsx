import Link from "next/link"
import { ArrowRight, MessageSquare, PenTool, SearchCheck, Sparkles, Users, Zap } from "lucide-react"
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
          <Badge
            variant="secondary"
            className="glass cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
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
    gradient: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10 ring-violet-500/20",
  },
  {
    title: "포트폴리오 중심 탐색",
    description: "분야, 스킬, 툴, 스타일 태그로 조건을 좁히고 실제 작업 결과물을 먼저 확인합니다.",
    icon: PenTool,
    gradient: "from-blue-500/20 to-cyan-500/10",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10 ring-blue-500/20",
  },
  {
    title: "메시지로 바로 협업 문의",
    description: "포트폴리오를 본 뒤 메시지를 보내면 바로 1:1 대화가 시작되어 다음 단계가 끊기지 않습니다.",
    icon: MessageSquare,
    gradient: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-500",
    iconBg: "bg-pink-500/10 ring-pink-500/20",
  },
]

const onboardingSteps = [
  {
    title: "포트폴리오 탐색",
    description: "분야와 스타일을 기준으로 작업자를 둘러보세요.",
    icon: SearchCheck,
  },
  {
    title: "포트폴리오 등록",
    description: "내 작업을 등록해 협업 요청을 받을 준비를 하세요.",
    icon: PenTool,
  },
  {
    title: "메시지로 협의",
    description: "원하는 상대를 찾으면 바로 일정과 범위를 논의할 수 있습니다.",
    icon: MessageSquare,
  },
]

const marqueeItems = [
  "웹툰", "일러스트", "애니메이션", "배경 아트", "채색", "캐릭터 디자인",
  "웹툰", "일러스트", "애니메이션", "배경 아트", "채색", "캐릭터 디자인",
]

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()])

  return (
    <div className="mx-auto max-w-7xl space-y-0">

      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] overflow-hidden flex items-center justify-center py-24 md:py-32">
        {/* Mesh gradient background */}
        <div className="mesh-gradient absolute inset-0 -z-10" />

        {/* Dot grid */}
        <div className="dot-grid absolute inset-0 -z-10 opacity-60" />

        {/* Grain overlay */}
        <div className="grain-overlay absolute inset-0 -z-10 overflow-hidden" />

        {/* Floating orbs */}
        <div
          className="animate-float absolute left-[8%] top-[15%] h-64 w-64 rounded-full opacity-20 blur-3xl pointer-events-none -z-10"
          style={{ background: "hsl(258 75% 55% / 0.5)", animationDelay: "0s" }}
        />
        <div
          className="animate-float absolute right-[10%] top-[25%] h-48 w-48 rounded-full opacity-15 blur-3xl pointer-events-none -z-10"
          style={{ background: "hsl(200 80% 55% / 0.5)", animationDelay: "2s" }}
        />
        <div
          className="animate-float absolute left-[40%] bottom-[15%] h-56 w-56 rounded-full opacity-10 blur-3xl pointer-events-none -z-10"
          style={{ background: "hsl(320 70% 55% / 0.5)", animationDelay: "4s" }}
        />
        <div
          className="animate-float absolute right-[25%] bottom-[30%] h-32 w-32 rounded-full opacity-20 blur-2xl pointer-events-none -z-10"
          style={{ background: "hsl(258 75% 55% / 0.4)", animationDelay: "1s" }}
        />

        {/* Decorative ring */}
        <div className="animate-spin-slow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-primary/5 pointer-events-none -z-10" />
        <div className="animate-spin-slow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full border border-primary/3 pointer-events-none -z-10" style={{ animationDirection: "reverse" }} />

        {/* Content */}
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-down">
            <span className="animate-shimmer inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 px-5 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              작가와 어시스턴트를 위한 프리미엄 매칭 플랫폼
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h1 className="text-5xl font-black tracking-tight leading-[1.1] md:text-[4.5rem] md:leading-[1.05] lg:text-[5.5rem]">
              완벽한{" "}
              <span className="gradient-text">작업 파트너</span>와<br className="hidden sm:block" />
              {" "}함께 놀라운{" "}
              <span className="gradient-text">작품</span>을<br className="hidden md:block" />
              {" "}완성하세요
            </h1>
          </div>

          {/* Subtext */}
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              웹툰, 일러스트부터 애니메이션까지. 포트폴리오를 탐색하고
              꼭 맞는 어시스턴트와 즉시 협업을 시작할 수 있습니다.
            </p>
          </div>

          {/* Stats row */}
          <div className="animate-fade-up flex flex-wrap justify-center gap-6 text-sm" style={{ animationDelay: "280ms" }}>
            {[
              { icon: Users, label: "활성 작가", value: "1,200+" },
              { icon: PenTool, label: "공개 포트폴리오", value: "3,800+" },
              { icon: Zap, label: "성사된 협업", value: "890+" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4 text-primary/60" />
                <span className="font-semibold text-foreground">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div
            className="animate-fade-up flex flex-col justify-center gap-4 sm:flex-row w-full sm:w-auto pt-2"
            style={{ animationDelay: "350ms" }}
          >
            <div className="glow">
              <Button
                asChild
                size="lg"
                className="min-w-48 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all text-base py-6 bg-primary hover:bg-primary/90"
              >
                <Link href="/explore">
                  포트폴리오 탐색하기
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="glass min-w-48 rounded-full text-base py-6 border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
            >
              <Link href="/studio/portfolios/new">내 작품 올리기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Marquee Section ── */}
      <section className="relative overflow-hidden border-y border-border/50 bg-background/60 py-5 backdrop-blur-sm">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex">
          <div className="animate-marquee flex shrink-0 items-center gap-0 whitespace-nowrap">
            {marqueeItems.map((item, i) => (
              <span key={i} className="flex items-center">
                <span className="px-6 text-sm font-medium text-muted-foreground/70 tracking-widest uppercase">
                  {item}
                </span>
                <span className="text-primary/30 text-lg">·</span>
              </span>
            ))}
          </div>
          <div className="animate-marquee flex shrink-0 items-center gap-0 whitespace-nowrap" aria-hidden>
            {marqueeItems.map((item, i) => (
              <span key={i} className="flex items-center">
                <span className="px-6 text-sm font-medium text-muted-foreground/70 tracking-widest uppercase">
                  {item}
                </span>
                <span className="text-primary/30 text-lg">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards Section ── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="animate-fade-up mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary/70">
              왜 DrawMate인가요?
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              크리에이터를 위한{" "}
              <span className="gradient-text">스마트한 협업</span>
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg max-w-xl mx-auto">
              필요한 파트너를 찾고, 작업을 공유하고, 바로 협업을 시작하세요.
            </p>
          </div>

          <div className="stagger-children grid gap-6 md:grid-cols-3">
            {featureCards.map(({ title, description, icon: Icon, gradient, iconColor, iconBg }) => (
              <div
                key={title}
                className={`hover-lift glass group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br ${gradient} p-8 transition-all hover:border-primary/20`}
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "linear-gradient(135deg, hsl(258 75% 55% / 0.08), transparent)" }}
                />
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} ${iconColor} ring-1 transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio Showcase + Sidebar ── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">

            {/* Portfolio grid */}
            <div className="min-w-0 space-y-6">
              {/* Section header */}
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
                    최신 작업물
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">
                    최신 포트폴리오
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    실제 작업 스타일을 확인하고 바로 협업 문의로 이어가세요.
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex shrink-0 text-muted-foreground hover:text-foreground gap-1">
                  <Link href="/explore">
                    전체 보기
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {portfolios.length === 0 ? (
                <div className="glass rounded-3xl border border-dashed border-border/60 px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <PenTool className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-lg font-semibold">아직 공개된 포트폴리오가 많지 않아요</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    첫 번째 포트폴리오를 등록하거나 탐색에서 조건을 넓혀 새 협업 파트너를 찾아보세요.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild>
                      <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/explore">탐색으로 이동</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  {/* Gradient fade at bottom */}
                  {portfolios.length >= 6 && (
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
                  )}
                </div>
              )}

              <div className="pt-2 sm:hidden">
                <Button asChild variant="outline" className="w-full glass rounded-full">
                  <Link href="/explore">전체 보기</Link>
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Popular tags card */}
              <div className="glass hover-lift rounded-3xl border border-border/60 p-6">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                    <SearchCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold">인기 태그</h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">
                  자주 찾는 작업 분야부터 바로 탐색할 수 있습니다.
                </p>
                <TagSection tags={tags} />
              </div>

              {/* Onboarding steps card */}
              <div className="glass hover-lift rounded-3xl border border-border/60 p-6">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold">이렇게 시작하세요</h2>
                </div>
                <div className="mt-5 space-y-5">
                  {onboardingSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="gradient-text flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 text-sm font-bold ring-1 ring-primary/20">
                        {index + 1}
                      </div>
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="glow mt-6">
                  <Button asChild variant="outline" className="w-full glass rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all">
                    <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

    </div>
  )
}
