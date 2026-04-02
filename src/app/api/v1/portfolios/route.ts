import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";
import { createPortfolioSchema } from "@/validators/portfolio";
import { paginationSchema } from "@/validators/common";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 40);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

type SortOption = "latest" | "popular" | "price_asc" | "price_desc";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_CURSOR_REGEX = /^[0-9T:.+\-Z]+$/;

interface CursorPayload {
  published_at: string;
  id: string;
}

interface PortfolioQueryRow {
  id: string;
  published_at: string;
  bookmark_count: number;
  starting_price_krw: number | null;
  [key: string]: unknown;
}

interface PortfolioImageRow {
  portfolio_id: string;
  display_path: string | null;
  thumb_path: string | null;
  original_path: string;
  is_cover: boolean;
  sort_order: number;
}

interface TagRow {
  id: string;
  slug: string;
  category: "field" | "skill" | "tool" | "style";
}

interface PortfolioTagRow {
  portfolio_id: string;
}

interface TagCategoryFilter {
  category: TagRow["category"];
  slugs: string[];
}

function normalizeSortOption(value: string | null): SortOption {
  if (value === "latest" || value === "popular" || value === "price_asc" || value === "price_desc") {
    return value;
  }
  return "latest";
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorPayload;
  } catch {
    return null;
  }
}

function isSafeIsoCursor(value: string): boolean {
  if (!ISO_CURSOR_REGEX.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function intersectIds(base: Set<string> | null, next: Set<string>): Set<string> {
  if (!base) return next;
  const intersection = new Set<string>();
  for (const id of base) {
    if (next.has(id)) {
      intersection.add(id);
    }
  }
  return intersection;
}

async function resolvePortfolioIdsByTagFilters(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: TagCategoryFilter[]
): Promise<{ ids: string[]; error: boolean }> {
  const allSlugs = Array.from(new Set(filters.flatMap((filter) => filter.slugs)));
  if (allSlugs.length === 0) {
    return { ids: [], error: false };
  }

  const { data: rawTagRows, error: tagError } = await supabase
    .from("tags")
    .select("id, slug, category")
    .in("slug", allSlugs)
    .eq("is_active", true);

  if (tagError) {
    return { ids: [], error: true };
  }

  const tagRows = (rawTagRows ?? []) as TagRow[];
  let candidateIds: Set<string> | null = null;

  for (const filter of filters) {
    const matchedTagIds = tagRows
      .filter((tag) => tag.category === filter.category && filter.slugs.includes(tag.slug))
      .map((tag) => tag.id);

    if (matchedTagIds.length === 0) {
      return { ids: [], error: false };
    }

    const { data: rawPortfolioTagRows, error: portfolioTagError } = await supabase
      .from("portfolio_tags")
      .select("portfolio_id")
      .in("tag_id", matchedTagIds);

    if (portfolioTagError) {
      return { ids: [], error: true };
    }

    const categoryIds = new Set(
      ((rawPortfolioTagRows ?? []) as PortfolioTagRow[]).map((row) => row.portfolio_id)
    );

    if (categoryIds.size === 0) {
      return { ids: [], error: false };
    }

    candidateIds = intersectIds(candidateIds, categoryIds);
    if (candidateIds.size === 0) {
      return { ids: [], error: false };
    }
  }

  return { ids: Array.from(candidateIds ?? []), error: false };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get("limit") ?? undefined;
  const parsedPagination = paginationSchema.safeParse({
    limit: limitParam,
  });

  if (!parsedPagination.success) {
    return response.validationError("유효하지 않은 페이지네이션 파라미터입니다.");
  }

  const { limit } = parsedPagination.data;

  const q = searchParams.get("q") ?? undefined;
  const cursorParam = searchParams.get("cursor") ?? undefined;
  const sort = normalizeSortOption(searchParams.get("sort"));

  const fieldTags = searchParams.getAll("fieldTags[]");
  const skillTags = searchParams.getAll("skillTags[]");
  const toolTags = searchParams.getAll("toolTags[]");
  const styleTags = searchParams.getAll("styleTags[]");

  const supabase = await createClient();
  const tagCategoryFilters: TagCategoryFilter[] = [
    { category: "field" as const, slugs: fieldTags },
    { category: "skill" as const, slugs: skillTags },
    { category: "tool" as const, slugs: toolTags },
    { category: "style" as const, slugs: styleTags },
  ].filter((filter): filter is TagCategoryFilter => filter.slugs.length > 0);

  let filteredPortfolioIds: string[] | null = null;
  if (tagCategoryFilters.length > 0) {
    const { ids, error: tagFilterError } = await resolvePortfolioIdsByTagFilters(
      supabase,
      tagCategoryFilters
    );

    if (tagFilterError) {
      return response.error("INTERNAL_ERROR", "태그 필터를 적용하는데 실패했습니다.", 500);
    }

    if (ids.length === 0) {
      return response.success({ items: [], nextCursor: null, hasMore: false }, { total: 0 });
    }

    filteredPortfolioIds = ids;
  }

  let query = supabase
    .from("portfolios")
    .select(
      `id, slug, title, summary, status, visibility, bookmark_count, view_count, published_at, starting_price_krw, owner_id, template_id,
       profiles:owner_id(display_name, avatar_path)`
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .limit(limit + 1);

  // Full-text / trigram search on search_text column
  if (q) {
    query = query.ilike("search_text", `%${q}%`);
  }

  if (filteredPortfolioIds) {
    query = query.in("id", filteredPortfolioIds);
  }

  if (sort === "price_asc" || sort === "price_desc") {
    query = query.not("starting_price_krw", "is", null);
  }

  // Cursor-based pagination
  if (cursorParam) {
    const decoded = decodeCursor(cursorParam);
    if (!decoded || typeof decoded.id !== "string" || typeof decoded.published_at !== "string") {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }

    if (sort === "latest") {
      if (!UUID_REGEX.test(decoded.id) || !isSafeIsoCursor(decoded.published_at)) {
        return response.validationError("유효하지 않은 커서 형식입니다.");
      }
      query = query.or(
        `published_at.lt.${decoded.published_at},and(published_at.eq.${decoded.published_at},id.lt.${decoded.id})`
      );
    } else if (sort === "popular") {
      const bookmarkCursor = Number(decoded.published_at);
      if (!Number.isFinite(bookmarkCursor)) {
        return response.validationError("유효하지 않은 커서 형식입니다.");
      }
      query = query.lt("bookmark_count", bookmarkCursor); // reuse field as bookmark_count cursor
    } else if (sort === "price_asc") {
      const priceCursor = Number(decoded.published_at);
      if (!Number.isFinite(priceCursor) || !UUID_REGEX.test(decoded.id)) {
        return response.validationError("유효하지 않은 커서 형식입니다.");
      }
      query = query.or(
        `starting_price_krw.gt.${priceCursor},and(starting_price_krw.eq.${priceCursor},id.lt.${decoded.id})`
      );
    } else if (sort === "price_desc") {
      const priceCursor = Number(decoded.published_at);
      if (!Number.isFinite(priceCursor) || !UUID_REGEX.test(decoded.id)) {
        return response.validationError("유효하지 않은 커서 형식입니다.");
      }
      query = query.or(
        `starting_price_krw.lt.${priceCursor},and(starting_price_krw.eq.${priceCursor},id.lt.${decoded.id})`
      );
    }
  }

  // Sorting
  if (sort === "latest") {
    query = query.order("published_at", { ascending: false }).order("id", { ascending: false });
  } else if (sort === "popular") {
    query = query.order("bookmark_count", { ascending: false }).order("published_at", { ascending: false });
  } else if (sort === "price_asc") {
    query = query
      .order("starting_price_krw", { ascending: true, nullsFirst: false })
      .order("id", { ascending: false });
  } else if (sort === "price_desc") {
    query = query
      .order("starting_price_krw", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false });
  }

  const { data: portfolios, error } = await query;

  if (error) {
    return response.error("INTERNAL_ERROR", "포트폴리오 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = (portfolios ?? []) as unknown as PortfolioQueryRow[];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    let cursorValue = last.published_at;
    if (sort === "popular") cursorValue = String(last.bookmark_count);
    else if (sort === "price_asc" || sort === "price_desc") cursorValue = String(last.starting_price_krw);

    nextCursor = encodeCursor({ published_at: cursorValue, id: last.id });
  }

  const portfolioIds = pageItems.map((item) => item.id);
  const thumbnailByPortfolioId = new Map<string, string | null>();

  if (portfolioIds.length > 0) {
    const { data: rawImageRows, error: imageError } = await supabase
      .from("portfolio_images")
      .select("portfolio_id, display_path, thumb_path, original_path, is_cover, sort_order")
      .in("portfolio_id", portfolioIds)
      .order("sort_order", { ascending: true });

    if (imageError) {
      return response.error("INTERNAL_ERROR", "썸네일 정보를 불러오는데 실패했습니다.", 500);
    }

    const imageRows = (rawImageRows ?? []) as PortfolioImageRow[];
    const grouped = new Map<string, PortfolioImageRow[]>();

    for (const image of imageRows) {
      const images = grouped.get(image.portfolio_id) ?? [];
      images.push(image);
      grouped.set(image.portfolio_id, images);
    }

    for (const portfolioId of portfolioIds) {
      const images = grouped.get(portfolioId) ?? [];
      const cover = images.find((image) => image.is_cover) ?? images[0] ?? null;
      const publicPath = cover?.thumb_path ?? cover?.display_path ?? cover?.original_path ?? null;
      const thumbnailUrl = publicPath
        ? supabase.storage.from("portfolio-public").getPublicUrl(publicPath).data.publicUrl
        : null;
      thumbnailByPortfolioId.set(portfolioId, thumbnailUrl);
    }
  }

  const mappedItems = (toCamelCaseKeys(pageItems) as Array<Record<string, unknown>>).map(
    (item) => {
      const rawProfile = item.profiles as
        | { displayName?: string | null; avatarPath?: string | null }
        | Array<{ displayName?: string | null; avatarPath?: string | null }>
        | null
        | undefined;
      const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
      const avatarPath = profile?.avatarPath ?? null;
      const avatarUrl = avatarPath
        ? supabase.storage.from("profile-avatars").getPublicUrl(avatarPath).data.publicUrl
        : null;

      return {
        ...item,
        thumbnailUrl: thumbnailByPortfolioId.get(item.id as string) ?? null,
        profiles: profile
          ? {
              displayName: profile.displayName ?? null,
              avatarUrl,
            }
          : null,
      };
    }
  );

  return response.success({ items: mappedItems, nextCursor, hasMore }, { total: mappedItems.length });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response.validationError("요청 본문이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = createPortfolioSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return response.validationError("입력값이 올바르지 않습니다.", fieldErrors);
  }

  // Check max 10 portfolios per user
  const { count: portfolioCount } = await supabase
    .from("portfolios")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  if ((portfolioCount ?? 0) >= 10) {
    return response.error("UNPROCESSABLE_ENTITY", "포트폴리오는 최대 10개까지 등록 가능합니다.", 422);
  }

  const normalizedTitle = parsed.data.title?.trim() || "제목 없음";
  const normalizedSummary = parsed.data.summary?.trim() || "작업 소개를 입력해 주세요.";
  const slug = generateSlug(normalizedTitle);

  const insertData = {
    owner_id: user.id,
    slug,
    title: normalizedTitle,
    summary: normalizedSummary,
    description: parsed.data.description ?? null,
    template_id: parsed.data.templateId ?? null,
    starting_price_krw: parsed.data.startingPriceKrw ?? null,
    duration_days: parsed.data.durationDays ?? null,
    visibility: parsed.data.visibility ?? "public",
    template_customization: parsed.data.templateCustomization ?? {},
    status: "draft",
  };

  const { data: portfolio, error: insertError } = await supabase
    .from("portfolios")
    .insert(insertData)
    .select("id, slug, status")
    .single();

  if (insertError || !portfolio) {
    console.error("[POST /api/v1/portfolios] insert failed", {
      message: insertError?.message,
      code: insertError?.code,
      hint: insertError?.hint,
    });
    return response.error("INTERNAL_ERROR", "포트폴리오 생성에 실패했습니다.", 500);
  }

  return response.success({ portfolio: toCamelCaseKeys(portfolio) }, undefined, 201);
}
