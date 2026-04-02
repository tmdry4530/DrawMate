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
  isBookmarkedByViewer: boolean;
  isOwnerByViewer: boolean;
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
  let isOwnerByViewer = false;
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
    isOwnerByViewer = user.id === owner.id;
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
    isOwnerByViewer,
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
    <div className="pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          {/* Project Header */}
          <header className="space-y-4">
            <div className="flex items-center gap-2 text-tertiary text-sm font-bold tracking-widest uppercase font-headline">
              Featured Project
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-headline text-foreground tracking-tighter leading-none">
              {portfolio.title}
            </h1>
          </header>

          {/* Gallery */}
          <PortfolioGallery
            coverImage={portfolio.coverImage}
            images={portfolio.images}
            title={portfolio.title}
          />

          {/* Description */}
          {portfolio.description && (
            <article className="space-y-8">
              <p className="text-2xl font-medium leading-relaxed">
                {portfolio.description}
              </p>
            </article>
          )}

          {/* Tags */}
          {portfolio.tags.length > 0 && (
            <section className="space-y-4 pt-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project Tags</h4>
              <TagChips tags={portfolio.tags} />
            </section>
          )}
        </div>

        {/* Sticky Sidebar */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28 space-y-8">
            <OwnerCard
              userId={portfolio.owner.id}
              displayName={portfolio.owner.displayName}
              headline={portfolio.owner.headline}
              avatarUrl={portfolio.owner.avatarUrl}
            />

            {/* Price & Duration */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price
                </p>
                <p className="mt-2 text-xl font-black font-headline tracking-tight">{formatPrice(portfolio.price)}</p>
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time
                </p>
                <p className="mt-2 text-xl font-black font-headline tracking-tight">
                  {portfolio.durationDays ? `${portfolio.durationDays}일` : "협의"}
                </p>
              </div>
            </div>

            {/* CTA */}
            <ContactCta
              targetUserId={portfolio.owner.id}
              isOwner={portfolio.isOwnerByViewer}
              className="w-full"
            />

            {/* Bookmark */}
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-muted-foreground">저장하기</span>
              <BookmarkButton
                portfolioId={portfolio.id}
                initialBookmarked={portfolio.isBookmarkedByViewer}
                initialCount={portfolio.bookmarkCount}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
