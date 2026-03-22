import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";
import { conversationListSchema } from "@/validators/messaging";

function encodeCursor(lastMessageAt: string | null, id: string): string {
  return Buffer.from(JSON.stringify({ lastMessageAt, id })).toString("base64");
}

function decodeCursor(cursor: string): { lastMessageAt: string | null; id: string } | null {
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
  const parsed = conversationListSchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return response.validationError("유효하지 않은 파라미터입니다.");
  }

  const { cursor, limit } = parsed.data;

  // Get conversation IDs the user participates in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from("conversations")
    .select(
      `id, last_message_at, last_message_id,
       conversation_participants!inner(user_id, last_read_message_id, last_read_at),
       messages(id, body, message_type, sender_id, created_at)`
    )
    .eq("conversation_participants.user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(limit + 1) as any;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }
    if (decoded.lastMessageAt) {
      query = query.or(
        `last_message_at.lt.${decoded.lastMessageAt},and(last_message_at.eq.${decoded.lastMessageAt},id.lt.${decoded.id})`
      );
    } else {
      query = query.lt("id", decoded.id);
    }
  }

  const { data: conversations, error: fetchError } = await query;

  if (fetchError) {
    return response.error("INTERNAL_ERROR", "대화방 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = conversations ?? [];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  // For each conversation, fetch the peer profile and compute unread count
  const enriched = await Promise.all(
    pageItems.map(async (conv: any) => {
      // Get peer user_id (not current user)
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id)
        .neq("user_id", user.id)
        .limit(1);

      const peerUserId = participants?.[0]?.user_id ?? null;

      let peer: Record<string, unknown> | null = null;
      if (peerUserId) {
        const { data: peerProfile } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_path")
          .eq("id", peerUserId)
          .maybeSingle();
        peer = peerProfile ? (toCamelCaseKeys(peerProfile) as Record<string, unknown>) : null;
      }

      // Count unread messages
      const myParticipant = conv.conversation_participants?.find(
        (p: any) => p.user_id === user.id
      );
      const lastReadAt = myParticipant?.last_read_at ?? null;

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .is("deleted_at", null)
        .gt("created_at", lastReadAt ?? "1970-01-01T00:00:00Z");

      // Last message snippet
      const lastMsg = conv.last_message_id
        ? conv.messages?.find((m: any) => m.id === conv.last_message_id)
        : null;
      const lastMessageSnippet = lastMsg?.body
        ? lastMsg.body.substring(0, 100)
        : lastMsg
        ? "[attachment]"
        : null;

      return {
        conversationId: conv.id,
        lastMessageSnippet,
        lastMessageAt: conv.last_message_at,
        unreadCount: unreadCount ?? 0,
        peer,
      };
    })
  );

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(last.last_message_at, last.id);
  }

  return response.success({ items: enriched, nextCursor, hasMore });
}
