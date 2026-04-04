import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";

interface PortfolioImageRow {
  display_path: string | null;
  thumb_path: string | null;
  original_path: string;
  is_cover: boolean;
  sort_order: number;
}

interface PortfolioRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  view_count: number;
  bookmark_count: number;
  created_at: string;
  updated_at: string;
  portfolio_images?: PortfolioImageRow[];
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { data: portfolios, error } = await supabase
    .from("portfolios")
    .select(
      `id, slug, title, status, view_count, bookmark_count, created_at, updated_at,
       portfolio_images(display_path, thumb_path, original_path, is_cover, sort_order)`
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return response.error("INTERNAL_ERROR", "포트폴리오 목록을 불러오는데 실패했습니다.", 500);
  }

  const rows = (portfolios ?? []) as PortfolioRow[];
  const items = rows.map((portfolio) => {
    const images = [...(portfolio.portfolio_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const cover = images.find((image) => image.is_cover) ?? images[0] ?? null;
    const publicPath = cover?.thumb_path ?? cover?.display_path ?? cover?.original_path ?? null;

    let coverImageUrl: string | null = null;
    if (publicPath) {
      const { data: urlData } = supabase.storage.from("portfolio-public").getPublicUrl(publicPath);
      coverImageUrl = urlData.publicUrl;
    }

    return {
      id: portfolio.id,
      slug: portfolio.slug,
      title: portfolio.title,
      status: portfolio.status,
      viewCount: portfolio.view_count,
      bookmarkCount: portfolio.bookmark_count,
      createdAt: portfolio.created_at,
      updatedAt: portfolio.updated_at,
      coverImageUrl,
    };
  });

  return response.success({ items });
}
