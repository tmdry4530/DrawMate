import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";
import { notificationListSchema } from "@/validators/messaging";

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString("base64");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

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
  const parsed = notificationListSchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    unreadOnly: searchParams.get("unreadOnly") ?? undefined,
  });

  if (!parsed.success) {
    return response.validationError("유효하지 않은 파라미터입니다.");
  }

  const { cursor, limit, unreadOnly } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from("notifications")
    .select("id, type, title, body, entity_type, entity_id, payload, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1) as any;

  if (unreadOnly) {
    query = query.is("read_at", null);
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }
    query = query.or(
      `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`
    );
  }

  const { data: notifications, error: fetchError } = await query;

  if (fetchError) {
    return response.error("INTERNAL_ERROR", "알림 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = notifications ?? [];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  // Get total unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(last.created_at, last.id);
  }

  return response.success({
    items: toCamelCaseKeys(pageItems),
    nextCursor,
    hasMore,
    unreadCount: unreadCount ?? 0,
  });
}
