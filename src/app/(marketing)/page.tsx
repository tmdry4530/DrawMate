import Link from "next/link";
import { ArrowRight, Mail, Shield, Handshake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { createClient } from "@/lib/supabase/server-client";

interface PortfolioRow {
  id: string;
  slug: string;
  title: string;
  bookmark_count: number;
  owner: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
  cover_image:
    | {
        thumb_path: string | null;
        display_path: string | null;
        original_path: string | null;
        is_cover: boolean;
        sort_order: number;
      }
    | {
        thumb_path: string | null;
        display_path: string | null;
        original_path: string | null;
        is_cover: boolean;
        sort_order: number;
      }[]
    | null;
}

interface CoverImageRow {
  thumb_path: string | null;
  display_path: string | null;
  original_path: string | null;
  is_cover: boolean;
  sort_order: number;
}

interface TagRow {
  id: string;
  slug: string;
  name: string;
  category: string;
}

async function getRecentPortfolios(): Promise<PortfolioRow[]> {
  const supabase = await createClient();
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
    .limit(9);

  const rows = (data ?? []) as unknown as PortfolioRow[];
  return rows.map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    const rawCoverImages = Array.isArray(row.cover_image)
      ? row.cover_image
      : row.cover_image
        ? [row.cover_image]
        : [];
    const orderedCoverImages = [...rawCoverImages].sort(
      (a: CoverImageRow, b: CoverImageRow) => a.sort_order - b.sort_order
    );
    const selectedCoverImage =
      orderedCoverImages.find((image) => image.is_cover) ?? orderedCoverImages[0] ?? null;

    const avatarPath = owner?.avatar_path ?? null;
    const publicPath =
      selectedCoverImage?.thumb_path ??
      selectedCoverImage?.display_path ??
      selectedCoverImage?.original_path ??
      null;

    const avatarUrl = avatarPath
      ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl
      : null;
    const thumbUrl = publicPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(publicPath).data.publicUrl
      : null;

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
    };
  });
}

async function getPopularTags(): Promise<TagRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, slug, name, category")
    .eq("category", "field")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(12);

  return (data ?? []) as TagRow[];
}

const FALLBACK_TAGS = [
  "#캐릭터디자인",
  "#일러스트",
  "#3D아트",
  "#브랜딩",
  "#UI디자인",
  "#모션그래픽",
  "#웹툰",
  "#개념미술",
  "#타이포그래피",
  "#사진",
  "#영상편집",
  "#제품디자인",
];

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()]);

  const marqueeItems =
    tags.length > 0 ? tags.map((t) => `#${t.name}`) : FALLBACK_TAGS;

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 pt-24 pb-16 md:flex-row md:items-center md:gap-8 md:pt-32 lg:pt-40">
        {/* Left: copy */}
        <div className="flex-1 text-center md:text-left">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            크리에이터 플랫폼
          </p>
          <h1 className="font-headline text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            The Hub{" "}
            <span className="text-primary italic">for Creators</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-muted-foreground md:mx-0">
            완성도 높은 포트폴리오를 탐색하고, 재능 있는 작가와 바로 연결되세요.
            불필요한 과정은 없습니다.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row md:items-start">
            <Button
              asChild
              size="lg"
              className="gradient-primary h-12 rounded-full border-0 px-8 text-base font-semibold text-white"
            >
              <Link href="/explore">
                포트폴리오 탐색
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-foreground/30 px-8 text-base font-semibold"
            >
              <Link href="/sign-up">작가로 참여하기</Link>
            </Button>
          </div>
        </div>

        {/* Right: floating art cards */}
        <div className="relative flex-1 select-none">
          <div className="relative mx-auto h-[420px] w-full max-w-[480px]">
            {/* Background decorative cards */}
            <div
              className="absolute left-4 top-8 h-52 w-40 rounded-2xl bg-muted"
              style={{ transform: "rotate(-6deg)" }}
            />
            <div
              className="absolute right-4 top-12 h-48 w-36 rounded-2xl bg-primary/10"
              style={{ transform: "rotate(5deg)" }}
            />
            {/* Main hero image placeholder */}
            <div className="absolute inset-x-12 top-6 bottom-0 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
              <span className="font-headline text-4xl font-bold text-primary/30">
                DrawMate
              </span>
            </div>
            {/* Floating accent card */}
            <div
              className="absolute bottom-10 right-0 flex items-center gap-2 rounded-xl bg-card px-4 py-3 shadow-lg border border-border"
              style={{ transform: "rotate(3deg)" }}
            >
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-sm font-semibold">크리에이터 허브</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee Ticker ── */}
      <section className="bg-secondary py-5 overflow-hidden">
        <div className="relative flex">
          <div className="animate-marquee flex shrink-0 items-center gap-6 whitespace-nowrap">
            {marqueeItems.map((tag, i) => (
              <span key={`a-${i}`} className="flex items-center gap-6">
                <span className="text-sm font-semibold tracking-wide text-foreground">
                  {tag}
                </span>
                <Star className="h-3 w-3 shrink-0 text-primary fill-primary" />
              </span>
            ))}
          </div>
          <div className="animate-marquee flex shrink-0 items-center gap-6 whitespace-nowrap" aria-hidden>
            {marqueeItems.map((tag, i) => (
              <span key={`b-${i}`} className="flex items-center gap-6">
                <span className="text-sm font-semibold tracking-wide text-foreground">
                  {tag}
                </span>
                <Star className="h-3 w-3 shrink-0 text-primary fill-primary" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Engineered for Talent
          </p>
          <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
            작업에 집중하세요.{" "}
            <span className="text-muted-foreground font-normal">나머지는 저희가.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Large card: Easy Messaging */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl bg-card border border-border p-8 flex flex-col gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-headline text-2xl font-bold">간편한 메시징</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                복잡한 절차 없이 작가에게 바로 메시지를 보내세요. 협업 문의부터 채용 제안까지 한 곳에서 관리됩니다.
              </p>
            </div>
            <div className="flex gap-3 mt-auto">
              <div className="h-2 w-16 rounded-full bg-primary" />
              <div className="h-2 w-10 rounded-full bg-muted" />
              <div className="h-2 w-12 rounded-full bg-muted" />
            </div>
          </div>

          {/* Secure Portfolio */}
          <div className="rounded-3xl bg-primary p-8 flex flex-col gap-4 text-primary-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-headline text-xl font-bold">안전한 포트폴리오</h3>
            <p className="text-sm leading-relaxed text-white/80">
              공개 범위 설정과 권한 관리로 내 작업물을 안전하게 보호하세요.
            </p>
          </div>

          {/* Direct Hiring */}
          <div className="rounded-3xl p-8 flex flex-col gap-4" style={{ backgroundColor: "#0d9488" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Handshake className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-headline text-xl font-bold text-white">다이렉트 채용</h3>
            <p className="text-sm leading-relaxed text-white/80">
              중간 단계 없이 작가와 직접 협업 계약을 체결하세요.
            </p>
          </div>

          {/* World Class Curation */}
          <div className="col-span-1 md:col-span-2 rounded-3xl bg-muted border border-border p-8 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background mb-4">
                <Star className="h-6 w-6 text-primary fill-primary" />
              </div>
              <h3 className="font-headline text-2xl font-bold">월드클래스 큐레이션</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                검증된 작가들의 포트폴리오만 엄선하여 제공합니다. 퀄리티 높은 크리에이터를 한눈에 발견하세요.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="h-28 w-20 rounded-2xl bg-primary/10" />
              <div className="h-28 w-20 rounded-2xl bg-primary/20" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 text-center overflow-hidden">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5" />
        <div className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5" />

        <div className="relative">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            지금 시작하세요
          </p>
          <h2 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            움직임을 시작할{" "}
            <span className="text-primary italic">준비가 되셨나요?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
            DrawMate와 함께 당신의 크리에이티브 커리어를 새롭게 시작하세요.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="gradient-primary h-12 rounded-full border-0 px-10 text-base font-semibold text-white"
            >
              <Link href="/sign-up">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 rounded-full px-10 text-base font-semibold"
            >
              <Link href="/explore">포트폴리오 둘러보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Portfolio Grid ── */}
      <section className="mx-auto max-w-7xl px-4 pb-32">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
            최신 작업물
          </h2>
          <p className="mt-3 text-muted-foreground">
            최근 등록된 포트폴리오를 탐색하고 협업을 제안하세요.
          </p>
        </div>

        {portfolios.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
            <p className="text-lg font-semibold">아직 공개된 포트폴리오가 없습니다</p>
            <p className="mt-2 text-sm text-muted-foreground">
              첫 작업물을 등록하면 탐색 화면에서 바로 노출됩니다.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/studio/portfolios/new">포트폴리오 등록하기</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => {
              const owner = Array.isArray(portfolio.owner) ? portfolio.owner[0] : portfolio.owner;
              const coverImage = Array.isArray(portfolio.cover_image)
                ? portfolio.cover_image[0]
                : portfolio.cover_image;

              return (
                <PortfolioCard
                  key={portfolio.id}
                  slug={portfolio.slug}
                  title={portfolio.title}
                  thumbnailUrl={coverImage?.thumb_path ?? null}
                  ownerName={owner?.display_name ?? "익명"}
                  ownerAvatarUrl={owner?.avatar_path ?? null}
                  bookmarkCount={portfolio.bookmark_count}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
