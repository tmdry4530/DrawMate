import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { conversationListSchema } from "@/validators/messaging";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_CURSOR_REGEX = /^[0-9T:.+\-Z]+$/;

interface ConversationRow {
  id: string;
  last_message_at: string | null;
  last_message_id: string | null;
}

interface MyParticipantRow {
  conversation_id: string;
  last_read_at: string | null;
}

interface LastMessageRow {
  id: string;
  body: string | null;
  message_type: string;
  sender_id: string;
  created_at: string;
}

interface PeerParticipantRow {
  conversation_id: string;
  user_id: string;
}

interface PeerProfileRow {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
}

interface UnreadMessageRow {
  conversation_id: string;
  created_at: string;
}

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

function isSafeIsoCursor(value: string): boolean {
  if (!ISO_CURSOR_REGEX.test(value)) return false;
  return Number.isFinite(Date.parse(value));
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

  const { data: rawMyParticipants, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  if (participantError) {
    return response.error("INTERNAL_ERROR", "대화 목록을 불러오는데 실패했습니다.", 500);
  }

  const myParticipants = (rawMyParticipants ?? []) as MyParticipantRow[];
  if (myParticipants.length === 0) {
    return response.success({ items: [], nextCursor: null, hasMore: false });
  }

  const readAtByConversationId = new Map<string, string | null>();
  const myConversationIds: string[] = [];
  for (const participant of myParticipants) {
    myConversationIds.push(participant.conversation_id);
    readAtByConversationId.set(participant.conversation_id, participant.last_read_at ?? null);
  }

  let query = supabase
    .from("conversations")
    .select("id, last_message_at, last_message_id")
    .in("id", myConversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded || typeof decoded.id !== "string" || !UUID_REGEX.test(decoded.id)) {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }

    if (decoded.lastMessageAt) {
      if (!isSafeIsoCursor(decoded.lastMessageAt)) {
        return response.validationError("유효하지 않은 커서 형식입니다.");
      }
      query = query.or(
        `last_message_at.lt.${decoded.lastMessageAt},and(last_message_at.eq.${decoded.lastMessageAt},id.lt.${decoded.id})`
      );
    } else {
      query = query.is("last_message_at", null).lt("id", decoded.id);
    }
  }

  const { data: rawConversations, error: conversationError } = await query;
  if (conversationError) {
    return response.error("INTERNAL_ERROR", "대화 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = (rawConversations ?? []) as ConversationRow[];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const conversationIds = pageItems.map((conversation) => conversation.id);

  const peerIdByConversationId = new Map<string, string>();
  const profileByUserId = new Map<string, PeerProfileRow>();
  const unreadCountByConversationId = new Map<string, number>();
  const lastMessageById = new Map<string, LastMessageRow>();

  for (const conversation of pageItems) {
    unreadCountByConversationId.set(conversation.id, 0);
  }

  if (conversationIds.length > 0) {
    const { data: rawPeerParticipants, error: peerError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds)
      .neq("user_id", user.id);

    if (peerError) {
      console.error("[GET /api/v1/conversations] peer participant query failed", peerError);
    } else {
      const peerParticipants = (rawPeerParticipants ?? []) as PeerParticipantRow[];
      for (const peerParticipant of peerParticipants) {
        peerIdByConversationId.set(peerParticipant.conversation_id, peerParticipant.user_id);
      }

      const peerIds = Array.from(new Set(peerParticipants.map((participant) => participant.user_id)));
      if (peerIds.length > 0) {
        const { data: rawPeerProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_path")
          .in("id", peerIds);

        if (profileError) {
          console.error("[GET /api/v1/conversations] peer profile query failed", profileError);
        } else {
          const peerProfiles = (rawPeerProfiles ?? []) as PeerProfileRow[];
          for (const peerProfile of peerProfiles) {
            profileByUserId.set(peerProfile.id, peerProfile);
          }
        }
      }
    }

    const lastMessageIds = pageItems
      .map((conversation) => conversation.last_message_id)
      .filter((value): value is string => !!value);

    if (lastMessageIds.length > 0) {
      const { data: rawLastMessages, error: lastMessageError } = await supabase
        .from("messages")
        .select("id, body, message_type, sender_id, created_at")
        .in("id", lastMessageIds)
        .is("deleted_at", null);

      if (lastMessageError) {
        console.error("[GET /api/v1/conversations] last message query failed", lastMessageError);
      } else {
        const lastMessages = (rawLastMessages ?? []) as LastMessageRow[];
        for (const message of lastMessages) {
          lastMessageById.set(message.id, message);
        }
      }
    }

    const { data: rawUnreadMessages, error: unreadError } = await supabase
      .from("messages")
      .select("conversation_id, created_at")
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .is("deleted_at", null);

    if (unreadError) {
      console.error("[GET /api/v1/conversations] unread query failed", unreadError);
    } else {
      const unreadMessages = (rawUnreadMessages ?? []) as UnreadMessageRow[];
      for (const message of unreadMessages) {
        const readAt = readAtByConversationId.get(message.conversation_id);
        if (!readAt || message.created_at > readAt) {
          unreadCountByConversationId.set(
            message.conversation_id,
            (unreadCountByConversationId.get(message.conversation_id) ?? 0) + 1
          );
        }
      }
    }
  }

  const enriched = pageItems.map((conversation) => {
    const lastMessage = conversation.last_message_id
      ? lastMessageById.get(conversation.last_message_id) ?? null
      : null;

    const peerId = peerIdByConversationId.get(conversation.id) ?? null;
    const peerProfile = peerId ? profileByUserId.get(peerId) ?? null : null;

    return {
      conversationId: conversation.id,
      lastMessageSnippet: lastMessage?.body
        ? lastMessage.body.substring(0, 100)
        : lastMessage
          ? "[attachment]"
          : null,
      lastMessageAt: conversation.last_message_at,
      unreadCount: unreadCountByConversationId.get(conversation.id) ?? 0,
      peer: peerProfile
        ? {
            id: peerProfile.id,
            displayName: peerProfile.display_name,
            avatarUrl: peerProfile.avatar_path
              ? supabase.storage
                  .from("profile-avatars")
                  .getPublicUrl(peerProfile.avatar_path).data.publicUrl
              : null,
          }
        : null,
    };
  });

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(last.last_message_at, last.id);
  }

  return response.success({ items: enriched, nextCursor, hasMore });
}
