import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function TagSection({ tags }: { tags: TagRow[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link key={tag.id} href={`/explore?fieldTags[]=${tag.slug}`}>
          <Badge
            variant="secondary"
            className="rounded-full border border-transparent bg-muted px-3 py-1 text-xs font-medium hover:border-border hover:bg-muted/70"
          >
            {tag.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [portfolios, tags] = await Promise.all([getRecentPortfolios(), getPopularTags()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
      {/* Minimalist Hero Section */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          협업 파트너를 찾는
          <br /> 가장 명확한 방법
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          불필요한 기능은 덜어내고 작업물에만 집중했습니다. 완성도 높은 포트폴리오를 탐색하고 바로 소통하세요.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-8 h-12 text-base">
            <Link href="/explore">
              포트폴리오 탐색
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="rounded-full px-8 h-12 text-base">
            <Link href="/studio/portfolios/new">스튜디오</Link>
          </Button>
        </div>
      </section>

      {/* Tags Section */}
      {tags.length > 0 && (
        <section className="mx-auto mt-24 max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Explore By Category
          </p>
          <div className="flex justify-center flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/explore?fieldTags[]=${tag.slug}`}>
                <Badge
                  variant="outline"
                  className="rounded-full border-muted-foreground/20 px-4 py-2 text-sm font-medium hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
                >
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-32 mb-20">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight">최신 작업물</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            최근 등록된 포트폴리오를 탐색하고 협업을 제안하세요.
          </p>
        </div>        {portfolios.length === 0 ? (
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
