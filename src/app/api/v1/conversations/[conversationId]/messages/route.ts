import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";
import { messageListSchema, sendMessageSchema } from "@/validators/messaging";

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

async function assertParticipant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const isParticipant = await assertParticipant(supabase, conversationId, user.id);
  if (!isParticipant) {
    return response.forbidden("대화방 참여자가 아닙니다.");
  }

  const { searchParams } = new URL(request.url);
  const parsed = messageListSchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return response.validationError("유효하지 않은 파라미터입니다.");
  }

  const { cursor, limit } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from("messages")
    .select(
      `id, conversation_id, sender_id, message_type, body, metadata, created_at, edited_at,
       message_attachments(id, storage_path, preview_path, mime_type, size_bytes, width, height, sort_order)`
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1) as any;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      return response.validationError("유효하지 않은 커서 형식입니다.");
    }
    query = query.or(
      `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`
    );
  }

  const { data: messages, error: fetchError } = await query;

  if (fetchError) {
    return response.error("INTERNAL_ERROR", "메시지 목록을 불러오는데 실패했습니다.", 500);
  }

  const items = messages ?? [];
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  // Update last_read_at for current user
  if (pageItems.length > 0) {
    const latestMessage = pageItems[0];
    await supabase
      .from("conversation_participants")
      .update({
        last_read_message_id: latestMessage.id,
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
  }

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const last = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(last.created_at, last.id);
  }

  const camelItems = (toCamelCaseKeys(pageItems) as any[]).map((msg: any) => ({
    ...msg,
    attachments: msg.messageAttachments ?? [],
    messageAttachments: undefined,
  }));

  return response.success({ items: camelItems, nextCursor, hasMore });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  const isParticipant = await assertParticipant(supabase, conversationId, user.id);
  if (!isParticipant) {
    return response.forbidden("대화방 참여자가 아닙니다.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response.validationError("요청 본문이 올바른 JSON 형식이 아닙니다.");
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return response.validationError("입력값이 올바르지 않습니다.", fieldErrors);
  }

  const { body: msgBody, attachmentIds } = parsed.data;

  // Determine message type
  const hasAttachments = attachmentIds && attachmentIds.length > 0;
  const hasBody = msgBody && msgBody.trim().length > 0;
  const messageType = hasAttachments && hasBody ? "mixed" : hasAttachments ? "image" : "text";

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: messageType,
      body: msgBody ?? null,
      metadata: {},
    })
    .select("id, conversation_id, sender_id, message_type, body, created_at")
    .single();

  if (insertError || !message) {
    return response.error("INTERNAL_ERROR", "메시지 전송에 실패했습니다.", 500);
  }

  // Link attachments if any
  let attachments: unknown[] = [];
  if (hasAttachments) {
    const { data: updatedAttachments } = await supabase
      .from("message_attachments")
      .update({ message_id: message.id })
      .in("id", attachmentIds!)
      .select("id, storage_path, preview_path, mime_type, size_bytes, width, height, sort_order");
    attachments = toCamelCaseKeys(updatedAttachments ?? []) as unknown[];
  }

  const camelMessage = toCamelCaseKeys(message) as Record<string, unknown>;

  return response.success(
    { message: { ...camelMessage, attachments } },
    undefined,
    201
  );
}
