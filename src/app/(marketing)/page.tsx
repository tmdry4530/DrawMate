import Link from "next/link"
import { ArrowRight, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    .limit(12)

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

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()])

  return (
    <div className="bg-[#FAF9F6] text-[#2C2C2C] min-h-screen">

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 lg:py-40">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left: Copy */}
            <div className="space-y-8">
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-[#5B7B6A]">
                Portfolio Matching Platform
              </p>

              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
                당신의 작품을,
                <br />
                <span className="text-[#5B7B6A]">레코드처럼</span>
                <br />
                세상에 틀어주세요.
              </h1>

              <p className="max-w-md text-lg leading-relaxed text-[#6B6B6B]">
                포트폴리오를 앨범처럼 등록하고, 딱 맞는 작업 파트너를 찾아
                바로 협업을 시작하세요.
              </p>

              {/* Genre Chips */}
              <div className="flex flex-wrap gap-2">
                {tags.length > 0
                  ? tags.slice(0, 6).map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/explore?fieldTags[]=${tag.slug}`}
                        className="rounded-full border border-[#2C2C2C]/15 bg-white px-4 py-2 text-sm font-medium transition-all hover:border-[#5B7B6A] hover:bg-[#5B7B6A] hover:text-white"
                      >
                        {tag.name}
                      </Link>
                    ))
                  : ["웹툰", "일러스트", "애니메이션", "캐릭터", "배경", "커미션"].map((name) => (
                      <span
                        key={name}
                        className="rounded-full border border-[#2C2C2C]/15 bg-white px-4 py-2 text-sm font-medium"
                      >
                        {name}
                      </span>
                    ))}
              </div>

              {/* CTA */}
              <div className="flex gap-4 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#2C2C2C] px-8 text-base font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  <Link href="/explore">
                    탐색 시작
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-[#2C2C2C]/20 px-8 text-base font-semibold hover:bg-[#2C2C2C]/5 transition-colors"
                >
                  <Link href="/studio/portfolios/new">내 작품 올리기</Link>
                </Button>
              </div>
            </div>

            {/* Right: Vinyl Record */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative h-[320px] w-[320px] md:h-[400px] md:w-[400px]">
                {/* Vinyl record */}
                <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full bg-[#1a1a1a] shadow-2xl">
                  {/* Grooves */}
                  <div className="absolute inset-4 rounded-full border border-[#333]" />
                  <div className="absolute inset-10 rounded-full border border-[#2a2a2a]" />
                  <div className="absolute inset-16 rounded-full border border-[#333]" />
                  <div className="absolute inset-20 rounded-full border border-[#2a2a2a]" />
                  <div className="absolute inset-24 rounded-full border border-[#333]" />
                  {/* Label */}
                  <div className="absolute inset-0 m-auto h-24 w-24 md:h-28 md:w-28 rounded-full bg-[#5B7B6A] flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <p className="text-[10px] font-bold tracking-wider text-white/90 uppercase">DrawMate</p>
                      <p className="text-[8px] text-white/60 mt-0.5">Records</p>
                    </div>
                  </div>
                  {/* Center hole */}
                  <div className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-[#FAF9F6]" />
                  {/* Shine */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                </div>

                {/* Tonearm */}
                <div className="absolute -top-2 right-4 md:right-8 origin-top-right">
                  <div className="w-1 h-32 md:h-40 bg-gradient-to-b from-[#888] to-[#666] rounded-full transform rotate-[25deg] shadow-lg">
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#555] rounded-full" />
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#999] rounded-full shadow" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Covers Section ── */}
      <section className="border-t border-[#2C2C2C]/8">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5B7B6A] mb-2">
                Featured Covers
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                최신 포트폴리오
              </h2>
              <p className="mt-2 text-[#6B6B6B]">
                앨범 커버를 넘기듯, 작업 스타일을 한눈에.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="hidden sm:inline-flex text-[#6B6B6B] hover:text-[#2C2C2C] gap-1"
            >
              <Link href="/explore">
                전체 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {portfolios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2C2C2C]/15 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#5B7B6A]/10">
                <PenTool className="h-5 w-5 text-[#5B7B6A]" />
              </div>
              <p className="text-lg font-semibold">아직 공개된 포트폴리오가 없어요</p>
              <p className="mt-2 text-sm text-[#6B6B6B]">
                첫 번째 포트폴리오를 등록하고 협업 파트너를 찾아보세요.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild className="rounded-full bg-[#2C2C2C] hover:bg-[#1a1a1a]">
                  <Link href="/studio/portfolios/new">포트폴리오 등록</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/explore">탐색으로 이동</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {portfolios.map((p) => {
                const owner = Array.isArray(p.owner) ? p.owner[0] : p.owner
                const coverImage = Array.isArray(p.cover_image) ? p.cover_image[0] : p.cover_image
                const thumbUrl = coverImage?.thumb_path ?? null

                return (
                  <Link
                    key={p.id}
                    href={`/portfolio/${p.slug}`}
                    className="group block"
                  >
                    {/* Album Cover */}
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-[#E8E6E1] shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <PenTool className="h-8 w-8 text-[#BFBDB6]" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="w-full p-4">
                          <p className="text-sm font-semibold text-white">상세보기</p>
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 space-y-0.5">
                      <p className="text-sm font-semibold truncate">{p.title}</p>
                      <p className="text-xs text-[#6B6B6B] truncate">
                        {owner?.display_name ?? "익명"}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="pt-6 sm:hidden">
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/explore">전체 보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-[#2C2C2C]/8 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5B7B6A] mb-2">
              How It Works
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              세 단계로 시작하세요
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "탐색",
                desc: "분야와 스타일을 기준으로 포트폴리오를 둘러보세요. 앨범을 고르듯 직관적으로.",
              },
              {
                step: "02",
                title: "등록",
                desc: "내 작업물을 앨범 커버처럼 등록하고, 협업 요청을 받을 준비를 하세요.",
              },
              {
                step: "03",
                title: "협업",
                desc: "마음에 드는 작업자를 찾으면 메시지 한 통으로 바로 협업이 시작됩니다.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2C2C2C]/10">
                  <span className="text-2xl font-bold text-[#5B7B6A]">{step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#2C2C2C] px-10 text-base font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <Link href="/sign-up">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
