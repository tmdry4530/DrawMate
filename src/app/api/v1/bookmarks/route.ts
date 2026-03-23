import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";
import { paginationSchema } from "@/validators/common";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const parsed = paginationSchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return response.validationError("유효하지 않은 페이지네이션 파라미터입니다.");
  }

  const { cursor, limit } = parsed.data;

  let query = supabase
    .from("bookmarks")
    .select(
      `id, created_at,
       portfolios(id, slug, title, summary, status, visibility, bookmark_count, view_count, published_at,
         profiles!portfolios_owner_id_fkey(id, display_name, avatar_path),
         portfolio_images(thumb_path, display_path, original_path, is_cover, sort_order))`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    if (!UUID_REGEX.test(cursor)) {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }
    const { data: cursorItem } = await supabase
      .from("bookmarks")
      .select("created_at")
      .eq("id", cursor)
      .single();
    if (cursorItem?.created_at) {
      query = query.lt("created_at", cursorItem.created_at);
    }
  }

  const { data: bookmarks, error } = await query;

  if (error) {
    return response.error("INTERNAL_ERROR", "북마크 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = bookmarks ?? [];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

  const mapped = pageItems.map((bm) => {
    const portfolio = (Array.isArray(bm.portfolios) ? bm.portfolios[0] : bm.portfolios) as Record<string, unknown> | null;
    const camelPortfolio = portfolio ? (toCamelCaseKeys(portfolio) as Record<string, unknown>) : null;
    const profile = camelPortfolio?.profiles as
      | { avatarPath?: string | null; displayName?: string | null }
      | undefined;
    const avatarPath = profile?.avatarPath ?? null;
    const avatarUrl = avatarPath
      ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl
      : null;

    const rawImages = (camelPortfolio?.portfolioImages as
      | Array<{
          thumbPath?: string | null;
          displayPath?: string | null;
          originalPath?: string | null;
          isCover?: boolean;
          sortOrder?: number;
        }>
      | undefined) ?? [];
    const sortedImages = [...rawImages].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const coverImage = sortedImages.find((image) => image.isCover) ?? sortedImages[0] ?? null;
    const thumbnailPath =
      coverImage?.thumbPath ?? coverImage?.displayPath ?? coverImage?.originalPath ?? null;
    const thumbnailUrl = thumbnailPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(thumbnailPath).data.publicUrl
      : null;

    return {
      id: bm.id,
      bookmarkedAt: bm.created_at,
      portfolio: camelPortfolio
        ? {
          ...camelPortfolio,
          thumbnailUrl,
          profiles: profile
              ? {
                  ...profile,
                  avatarUrl,
                }
              : null,
          }
        : null,
    };
  });

  return response.success({ items: mapped, nextCursor, hasMore }, { total: mapped.length });
}
