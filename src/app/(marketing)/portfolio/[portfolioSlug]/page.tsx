import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, DollarSign } from "lucide-react";
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

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    coverImage,
    images: imageUrls.length > 0 ? imageUrls : [coverImage],
    price: row.starting_price_krw,
    durationDays: row.duration_days,
    bookmarkCount: row.bookmark_count ?? 0,
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

  return {
    title: `${portfolio.title} | DrawMate`,
    description: portfolio.description.slice(0, 160),
  };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { portfolioSlug } = await params;
  const portfolio = await getPortfolioBySlug(portfolioSlug);

  if (!portfolio) {
    notFound();
  }

  return (
    <div className="container max-w-3xl px-4 py-8 space-y-8">
      <OwnerCard
        userId={portfolio.owner.id}
        displayName={portfolio.owner.displayName}
        headline={portfolio.owner.headline}
        avatarUrl={portfolio.owner.avatarUrl}
      />

      <h1 className="text-2xl font-bold leading-snug">{portfolio.title}</h1>

      <PortfolioGallery
        coverImage={portfolio.coverImage}
        images={portfolio.images}
        title={portfolio.title}
      />

      <section>
        <h2 className="text-base font-semibold mb-2">작품 소개</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {portfolio.description || "설명이 없습니다."}
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-2">태그</h2>
        <TagChips tags={portfolio.tags} />
      </section>

      <section className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">가격</span>
          <span className="font-semibold">{formatPrice(portfolio.price)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">납기</span>
          <span className="font-semibold">
            {portfolio.durationDays ? `${portfolio.durationDays}일` : "협의"}
          </span>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2 border-t">
        <BookmarkButton
          portfolioId={portfolio.id}
          initialBookmarked={false}
          initialCount={portfolio.bookmarkCount}
        />
        <ContactCta targetUserId={portfolio.owner.id} />
      </div>
    </div>
  );
}
