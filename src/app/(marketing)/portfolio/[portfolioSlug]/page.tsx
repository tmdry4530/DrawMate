import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server-client";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { OwnerCard } from "@/components/portfolio/owner-card";
import { TagChips } from "@/components/portfolio/tag-chips";
import { BookmarkButton } from "@/components/portfolio/bookmark-button";
import { ContactCta } from "@/components/portfolio/contact-cta";

interface Props {
  params: Promise<{ portfolioSlug: string }>;
}

interface PortfolioImageRow {
  original_path: string;
  display_path: string | null;
  thumb_path: string | null;
  sort_order: number;
  is_cover: boolean;
}

interface PortfolioTagRow {
  tags:
    | {
        id: string;
        name: string;
        category: string;
      }
    | Array<{
        id: string;
        name: string;
        category: string;
      }>
    | null;
}

interface PortfolioRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  starting_price_krw: number | null;
  duration_days: number | null;
  bookmark_count: number;
  owner_id: string;
  portfolio_images: PortfolioImageRow[];
  portfolio_tags: PortfolioTagRow[];
  owner_profile:
    | {
        id: string;
        display_name: string | null;
        headline: string | null;
        avatar_path: string | null;
      }
    | Array<{
        id: string;
        display_name: string | null;
        headline: string | null;
        avatar_path: string | null;
      }>
    | null;
}

interface PortfolioDetailData {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  price: number | null;
  durationDays: number | null;
  bookmarkCount: number;
  isBookmarkedByViewer: boolean;
  tags: Array<{ id: string; name: string; category: string }>;
  owner: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
  };
}

function toPublicUrl(
  path: string | null,
  bucket: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function getPortfolioBySlug(portfolioSlug: string): Promise<PortfolioDetailData | null> {
  const supabase = await createClient();
  const decodedSlug = decodeURIComponent(portfolioSlug);
  const { data, error } = await supabase
    .from("portfolios")
    .select(
      `id, slug, title, description, starting_price_krw, duration_days, bookmark_count, owner_id,
       portfolio_images(original_path, display_path, thumb_path, sort_order, is_cover),
       portfolio_tags(tags(id, name, category)),
       owner_profile:profiles!owner_id(id, display_name, headline, avatar_path)`
    )
    .eq("slug", decodedSlug)
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as PortfolioRow;
  const sortedImages = [...(row.portfolio_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const imageUrls = sortedImages
    .map((image) => toPublicUrl(image.display_path ?? image.original_path, "portfolio-public", supabase))
    .filter((url): url is string => !!url);
  const coverRow = sortedImages.find((image) => image.is_cover) ?? sortedImages[0] ?? null;
  const coverImage =
    toPublicUrl(coverRow?.display_path ?? coverRow?.original_path ?? null, "portfolio-public", supabase) ??
    imageUrls[0] ??
    "";

  if (!coverImage) {
    return null;
  }

  const owner = Array.isArray(row.owner_profile) ? row.owner_profile[0] : row.owner_profile;
  if (!owner) {
    return null;
  }

  const tags = (row.portfolio_tags ?? [])
    .flatMap((item) => {
      if (!item.tags) return [];
      return Array.isArray(item.tags) ? item.tags : [item.tags];
    })
    .filter((tag): tag is { id: string; name: string; category: string } => !!tag);

  let isBookmarkedByViewer = false;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!authError && user) {
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("portfolio_id", row.id)
      .eq("user_id", user.id)
      .maybeSingle();

    isBookmarkedByViewer = !!bookmark;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    coverImage,
    images: imageUrls.length > 0 ? imageUrls : [coverImage],
    price: row.starting_price_krw,
    durationDays: row.duration_days,
    bookmarkCount: row.bookmark_count ?? 0,
    isBookmarkedByViewer,
    tags,
    owner: {
      id: owner.id,
      displayName: owner.display_name ?? "익명",
      headline: owner.headline,
      avatarUrl: toPublicUrl(owner.avatar_path, "profile-avatars", supabase),
    },
  };
}

function formatPrice(price: number | null): string {
  if (price === null) return "협의";
  return `${price.toLocaleString("ko-KR")}원`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { portfolioSlug } = await params;
  const portfolio = await getPortfolioBySlug(portfolioSlug);

  if (!portfolio) {
    return {
      title: "포트폴리오를 찾을 수 없습니다. | DrawMate",
    };
  }

  const desc = portfolio.description.slice(0, 160);
  return {
    title: `${portfolio.title} | DrawMate`,
    description: desc,
    openGraph: {
      title: portfolio.title,
      description: desc,
      images: portfolio.coverImage ? [{ url: portfolio.coverImage }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: portfolio.title,
      description: desc,
      images: portfolio.coverImage ? [portfolio.coverImage] : [],
    },
  };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { portfolioSlug } = await params;
  const portfolio = await getPortfolioBySlug(portfolioSlug);

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_340px] xl:gap-14">
        <section className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-snug">{portfolio.title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              포트폴리오를 확인한 뒤 메시지로 협업 가능 여부, 일정, 작업 범위를 바로 조율할 수 있습니다.
            </p>
          </div>

          <PortfolioGallery
            coverImage={portfolio.coverImage}
            images={portfolio.images}
            title={portfolio.title}
          />

          <section>
            <h2 className="mb-2 text-base font-semibold">작품 소개</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {portfolio.description || "설명이 없습니다."}
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">태그</h2>
            <TagChips tags={portfolio.tags} />
          </section>
        </section>

        <aside className="self-start lg:sticky lg:top-24">
          <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
            <OwnerCard
              userId={portfolio.owner.id}
              displayName={portfolio.owner.displayName}
              headline={portfolio.owner.headline}
              avatarUrl={portfolio.owner.avatarUrl}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  가격
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPrice(portfolio.price)}</p>
              </div>

              <div className="rounded-xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  납기
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {portfolio.durationDays ? `${portfolio.durationDays}일` : "협의"}
                </p>
              </div>
            </div>

            <div className="border-t pt-5">
              <div className="flex flex-col gap-3">
                <ContactCta
                  targetUserId={portfolio.owner.id}
                  className="w-full justify-center"
                />
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3">
                  <span className="text-sm font-medium">북마크</span>
                  <BookmarkButton
                    portfolioId={portfolio.id}
                    initialBookmarked={portfolio.isBookmarkedByViewer}
                    initialCount={portfolio.bookmarkCount}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm font-semibold">다음 단계</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {[
                  "포트폴리오와 태그를 확인해 작업 적합도를 판단합니다.",
                  "메시지로 문의하면 바로 1:1 대화방이 열립니다.",
                  "작업 범위, 일정, 예산을 협의해 협업을 이어갑니다.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
