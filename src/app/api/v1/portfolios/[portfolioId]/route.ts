import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys, toSnakeCaseKeys } from "@/server/mappers/case-converter";
import { updatePortfolioSchema } from "@/validators/portfolio";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Support both uuid and slug lookup
  const isUuid = UUID_REGEX.test(portfolioId);

  const baseQuery = supabase
    .from("portfolios")
    .select(
      `id, slug, title, summary, description, status, visibility, template_id, template_customization,
       starting_price_krw, duration_days, bookmark_count, view_count, published_at, created_at, updated_at, owner_id,
       portfolio_images(id, original_path, display_path, thumb_path, caption, width, height, sort_order, is_cover, created_at),
       portfolio_tags(tag_id, tags(id, slug, name, category)),
       profiles:owner_id(id, display_name, avatar_path, headline, availability_status)`
    )
    .is("deleted_at", null);

  const filtered = isUuid
    ? baseQuery.eq("id", portfolioId)
    : baseQuery.eq("slug", portfolioId);

  const { data: portfolio, error } = await filtered.single();

  if (error || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  const p = portfolio as Record<string, unknown>;

  // Access control: draft = owner only, published+public = anyone
  const ownerId = p.owner_id as string;
  const isOwner = !!user && user.id === ownerId;
  if (p.status !== "published" || p.visibility !== "public") {
    if (!isOwner) {
      return response.forbidden("접근 권한이 없습니다.");
    }
  }

  // Check if bookmarked by current user
  let isBookmarked = false;
  if (user) {
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("portfolio_id", p.id as string)
      .eq("user_id", user.id)
      .maybeSingle();
    isBookmarked = !!bookmark;
  }

  const images = ((p.portfolio_images as Array<Record<string, unknown>>) ?? [])
    .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0));

  const imageItems = images.map((image) => {
    const originalPath = image.original_path as string | null;
    const displayPath = image.display_path as string | null;
    const thumbPath = image.thumb_path as string | null;
    const publicPath = thumbPath ?? displayPath ?? originalPath;
    const publicUrl = publicPath
      ? supabase.storage.from("portfolio-public").getPublicUrl(publicPath).data.publicUrl
      : null;

    return {
      ...(toCamelCaseKeys(image) as Record<string, unknown>),
      url: publicUrl,
    };
  });

  const tags = ((p.portfolio_tags as Array<{ tag_id: string; tags: unknown }>) ?? [])
    .map((pt) => (pt.tags ? (toCamelCaseKeys(pt.tags) as Record<string, unknown>) : null))
    .filter((tag): tag is Record<string, unknown> => !!tag);

  const ownerProfile = p.profiles
    ? (toCamelCaseKeys(p.profiles) as Record<string, unknown>)
    : null;

  const result = {
    ...toCamelCaseKeys({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      description: p.description,
      status: p.status,
      visibility: p.visibility,
      templateId: p.template_id,
      templateCustomization: p.template_customization,
      startingPriceKrw: p.starting_price_krw,
      durationDays: p.duration_days,
      bookmarkCount: p.bookmark_count,
      viewCount: p.view_count,
      publishedAt: p.published_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      userId: ownerId,
    }) as Record<string, unknown>,
    images: imageItems,
    tags,
    owner: ownerProfile
      ? {
          ...ownerProfile,
          avatarUrl: ownerProfile.avatarPath ?? null,
        }
      : null,
    isBookmarked,
    isOwner: !!isOwner,
  };

  return response.success(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { data: portfolio, error: fetchError } = await supabase
    .from("portfolios")
    .select("id, owner_id, status")
    .eq("id", portfolioId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  if (portfolio.owner_id !== user.id) {
    return response.forbidden("수정 권한이 없습니다.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response.validationError("요청 본문이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = updatePortfolioSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return response.validationError("입력값이 올바르지 않습니다.", fieldErrors);
  }

  const { tagIds, ...updateFields } = parsed.data;
  const snakeData = toSnakeCaseKeys<Record<string, unknown>>(updateFields);

  const { data: updated, error: updateError } = await supabase
    .from("portfolios")
    .update({ ...snakeData, updated_at: new Date().toISOString() })
    .eq("id", portfolioId)
    .select()
    .single();

  if (updateError || !updated) {
    return response.error("INTERNAL_ERROR", `수정 실패: ${updateError?.message ?? "no data"} | code: ${updateError?.code ?? "none"} | keys: ${Object.keys(snakeData).join(",")}`, 500);
  }

  // Sync tags if provided
  if (tagIds !== undefined) {
    const { error: tagSyncError } = await supabase.rpc("replace_portfolio_tags", {
      p_portfolio_id: portfolioId,
      p_tag_ids: tagIds,
    });
    if (tagSyncError) {
      return response.error("INTERNAL_ERROR", "태그 동기화에 실패했습니다.", 500);
    }
  }

  return response.success(toCamelCaseKeys(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ portfolioId: string }> }
) {
  const { portfolioId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const { data: portfolio, error: fetchError } = await supabase
    .from("portfolios")
    .select("id, owner_id")
    .eq("id", portfolioId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !portfolio) {
    return response.notFound("포트폴리오를 찾을 수 없습니다.");
  }

  if (portfolio.owner_id !== user.id) {
    return response.forbidden("삭제 권한이 없습니다.");
  }

  const { error: deleteError } = await supabase
    .from("portfolios")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", portfolioId);

  if (deleteError) {
    return response.error("INTERNAL_ERROR", "포트폴리오 삭제에 실패했습니다.", 500);
  }

  return response.success({ deleted: true });
}
