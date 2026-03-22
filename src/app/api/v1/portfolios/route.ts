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

interface CursorPayload {
  published_at: string;
  id: string;
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
  const sort = (searchParams.get("sort") ?? "latest") as SortOption;

  const fieldTags = searchParams.getAll("fieldTags[]");
  const skillTags = searchParams.getAll("skillTags[]");
  const toolTags = searchParams.getAll("toolTags[]");
  const styleTags = searchParams.getAll("styleTags[]");

  const hasTagFilters =
    fieldTags.length > 0 || skillTags.length > 0 || toolTags.length > 0 || styleTags.length > 0;

  const supabase = await createClient();

  // Build select with owner profile join
  const selectColumns = hasTagFilters
    ? `id, slug, title, summary, status, visibility, bookmark_count, view_count, published_at, starting_price_krw, user_id, template_id,
       profiles:owner_id(display_name, avatar_path),
       portfolio_tags!inner(tags!inner(slug, category))`
    : `id, slug, title, summary, status, visibility, bookmark_count, view_count, published_at, starting_price_krw, user_id, template_id,
       profiles:owner_id(display_name, avatar_path)`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from("portfolios")
    .select(selectColumns)
    .eq("status", "published")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .limit(limit + 1) as any;

  // Full-text / trigram search on search_text column
  if (q) {
    query = query.ilike("search_text", `%${q}%`);
  }

  // Tag filters: AND between categories, OR within category
  if (fieldTags.length > 0) {
    query = query.in("portfolio_tags.tags.slug", fieldTags);
  }
  if (skillTags.length > 0) {
    query = query.in("portfolio_tags.tags.slug", skillTags);
  }
  if (toolTags.length > 0) {
    query = query.in("portfolio_tags.tags.slug", toolTags);
  }
  if (styleTags.length > 0) {
    query = query.in("portfolio_tags.tags.slug", styleTags);
  }

  // Cursor-based pagination
  if (cursorParam) {
    const decoded = decodeCursor(cursorParam);
    if (!decoded) {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }

    if (sort === "latest") {
      query = query.or(
        `published_at.lt.${decoded.published_at},and(published_at.eq.${decoded.published_at},id.lt.${decoded.id})`
      );
    } else if (sort === "popular") {
      query = query.lt("bookmark_count", decoded.published_at); // reuse field as bookmark_count cursor
    } else if (sort === "price_asc") {
      query = query.gt("starting_price_krw", Number(decoded.published_at));
    } else if (sort === "price_desc") {
      query = query.lt("starting_price_krw", Number(decoded.published_at));
    }
  }

  // Sorting
  if (sort === "latest") {
    query = query.order("published_at", { ascending: false }).order("id", { ascending: false });
  } else if (sort === "popular") {
    query = query.order("bookmark_count", { ascending: false }).order("published_at", { ascending: false });
  } else if (sort === "price_asc") {
    query = query.order("starting_price_krw", { ascending: true }).order("published_at", { ascending: false });
  } else if (sort === "price_desc") {
    query = query.order("starting_price_krw", { ascending: false }).order("published_at", { ascending: false });
  }

  const { data: portfolios, error } = await query;

  if (error) {
    return response.error("INTERNAL_ERROR", "포트폴리오 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = portfolios ?? [];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    let cursorValue = last.published_at;
    if (sort === "popular") cursorValue = String(last.bookmark_count);
    else if (sort === "price_asc" || sort === "price_desc") cursorValue = String(last.starting_price_krw ?? 0);

    nextCursor = encodeCursor({ published_at: cursorValue, id: last.id });
  }

  return response.success(
    { items: toCamelCaseKeys(pageItems), nextCursor, hasMore },
    { total: pageItems.length }
  );
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
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if ((portfolioCount ?? 0) >= 10) {
    return response.error("UNPROCESSABLE_ENTITY", "포트폴리오는 최대 10개까지 등록 가능합니다.", 422);
  }

  const slug = generateSlug(parsed.data.title);

  const insertData = {
    user_id: user.id,
    slug,
    title: parsed.data.title,
    summary: parsed.data.summary,
    description: parsed.data.description ?? null,
    template_id: parsed.data.templateId,
    starting_price_krw: parsed.data.startingPriceKrw ?? null,
    duration_days: parsed.data.durationDays ?? null,
    visibility: parsed.data.visibility ?? "public",
    template_customization: parsed.data.templateCustomization ?? null,
    status: "draft",
  };

  const { data: portfolio, error: insertError } = await supabase
    .from("portfolios")
    .insert(insertData)
    .select("id, slug, status")
    .single();

  if (insertError || !portfolio) {
    return response.error("INTERNAL_ERROR", "포트폴리오 생성에 실패했습니다.", 500);
  }

  return response.success({ portfolio: toCamelCaseKeys(portfolio) }, undefined, 201);
}
