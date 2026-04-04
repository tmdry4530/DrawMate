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
    <div className="bg-black text-white -mt-20 pt-20">
      <div className="pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-0">
            {/* Project Header */}
            <header className="py-12 border-b border-neutral-800">
              <div className="text-xs font-bold tracking-widest uppercase text-neutral-500 mb-4">
                Featured Project
              </div>
              <h1 className="text-5xl md:text-7xl font-black font-headline text-white tracking-tighter leading-none uppercase">
                {portfolio.title}
              </h1>
            </header>

            {/* Gallery */}
            <div className="py-12 border-b border-neutral-800">
              <PortfolioGallery
                coverImage={portfolio.coverImage}
                images={portfolio.images}
                title={portfolio.title}
              />
            </div>

            {/* Description */}
            {portfolio.description && (
              <article className="py-12 border-b border-neutral-800 space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500">
                  Project Philosophy
                </h2>
                <p className="text-xl font-medium leading-relaxed text-neutral-200">
                  {portfolio.description}
                </p>
              </article>
            )}

            {/* Tags */}
            {portfolio.tags.length > 0 && (
              <section className="py-12 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-neutral-500">Project Tags</h4>
                <TagChips tags={portfolio.tags} />
              </section>
            )}
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 border-t border-neutral-800 lg:border-t-0 lg:border-l lg:border-neutral-800 mt-0 pt-8 lg:pt-0 lg:pl-8">
            <div className="sticky top-28 space-y-0">
              {/* Owner Card */}
              <div className="pb-8 border-b border-neutral-800">
                <OwnerCard
                  userId={portfolio.owner.id}
                  displayName={portfolio.owner.displayName}
                  headline={portfolio.owner.headline}
                  avatarUrl={portfolio.owner.avatarUrl}
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 border-b border-neutral-800">
                <div className="py-6 pr-4 border-r border-neutral-800">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5 mb-3">
                    <DollarSign className="h-3.5 w-3.5" />
                    Price
                  </p>
                  <p className="text-xl font-black font-headline tracking-tight text-white">
                    {formatPrice(portfolio.price)}
                  </p>
                </div>
                <div className="py-6 pl-4">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5 mb-3">
                    <Clock className="h-3.5 w-3.5" />
                    Time
                  </p>
                  <p className="text-xl font-black font-headline tracking-tight text-white">
                    {portfolio.durationDays ? `${portfolio.durationDays}일` : "협의"}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="py-8 border-b border-neutral-800">
                <ContactCta
                  targetUserId={portfolio.owner.id}
                  isOwner={portfolio.isOwnerByViewer}
                  className="w-full rounded-none uppercase tracking-widest font-black border border-white bg-white text-black hover:bg-black hover:text-white transition-colors"
                />
              </div>

              {/* Bookmark */}
              <div className="py-6">
                <BookmarkButton
                  portfolioId={portfolio.id}
                  initialBookmarked={portfolio.isBookmarkedByViewer}
                  initialCount={portfolio.bookmarkCount}
                  className="w-full justify-center py-4 font-black uppercase tracking-widest"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
