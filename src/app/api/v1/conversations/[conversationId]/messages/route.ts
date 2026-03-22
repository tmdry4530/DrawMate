import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { messageListSchema, sendMessageSchema } from "@/validators/messaging";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_CURSOR_REGEX = /^[0-9T:.+\-Z]+$/;

interface MessageAttachmentRow {
  id: string;
  storage_path: string;
  preview_path: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  sort_order: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: string;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  edited_at: string | null;
  message_attachments?: MessageAttachmentRow[];
}

async function mapMessageRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  message: MessageRow
) {
  const attachments = await Promise.all(
    (message.message_attachments ?? []).map(async (attachment) => {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("chat-attachments")
        .createSignedUrl(attachment.storage_path, SIGNED_URL_EXPIRES_IN_SECONDS);

      return {
        id: attachment.id,
        storagePath: attachment.storage_path,
        previewPath: attachment.preview_path,
        mimeType: attachment.mime_type,
        sizeBytes: attachment.size_bytes,
        width: attachment.width,
        height: attachment.height,
        sortOrder: attachment.sort_order,
        imageUrl: signedUrlError ? null : (signedUrlData?.signedUrl ?? null),
      };
    })
  );

  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    messageType: message.message_type,
    body: message.body,
    metadata: message.metadata,
    createdAt: message.created_at,
    editedAt: message.edited_at,
    attachments,
  };
}

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

function isSafeIsoCursor(value: string): boolean {
  if (!ISO_CURSOR_REGEX.test(value)) return false;
  return Number.isFinite(Date.parse(value));
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
    .limit(limit + 1);

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (
      !decoded ||
      typeof decoded.createdAt !== "string" ||
      typeof decoded.id !== "string" ||
      !UUID_REGEX.test(decoded.id) ||
      !isSafeIsoCursor(decoded.createdAt)
    ) {
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

  const items = (messages ?? []) as MessageRow[];
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

  const mappedItems = await Promise.all(pageItems.map((item) => mapMessageRow(supabase, item)));

  return response.success({
    items: mappedItems,
    nextCursor,
    hasMore,
    currentUserId: user.id,
  });
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

  const contentType = request.headers.get("content-type") ?? "";

  let messageBody: string | null = null;
  let files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return response.validationError("요청 본문을 파싱할 수 없습니다.");
    }

    const content = formData.get("content");
    messageBody = typeof content === "string" ? content.trim() : null;
    if (messageBody === "") messageBody = null;

    const rawFiles = [
      ...formData.getAll("image"),
      ...formData.getAll("files[]"),
      ...formData.getAll("files"),
    ];
    files = rawFiles.filter((entry): entry is File => entry instanceof File);
  } else {
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

    if (parsed.data.attachmentIds && parsed.data.attachmentIds.length > 0) {
      return response.validationError("attachmentIds 기반 전송은 지원되지 않습니다.");
    }

    messageBody = parsed.data.body?.trim() ?? null;
    if (messageBody === "") messageBody = null;
  }

  if (!messageBody && files.length === 0) {
    return response.validationError("메시지 본문 또는 첨부파일이 필요합니다.");
  }

  if (files.length > MAX_FILES) {
    return response.validationError(`최대 ${MAX_FILES}개의 파일만 업로드 가능합니다.`);
  }

  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return response.error("FILE_TYPE_NOT_ALLOWED", `허용되지 않는 파일 형식입니다: ${file.type}`, 422);
    }
    if (file.size > MAX_FILE_SIZE) {
      return response.error("FILE_TOO_LARGE", "파일 크기는 최대 10MB입니다.", 422);
    }
  }

  const messageType = files.length > 0 ? "image" : "text";

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: messageType,
      body: messageBody,
      metadata: {},
    })
    .select("id, conversation_id, sender_id, message_type, body, metadata, created_at, edited_at")
    .single();

  if (insertError || !message) {
    return response.error("INTERNAL_ERROR", "메시지 전송에 실패했습니다.", 500);
  }

  const attachments: MessageAttachmentRow[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${conversationId}/${message.id}/${crypto.randomUUID()}_${index}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return response.error("INTERNAL_ERROR", "첨부 파일 업로드에 실패했습니다.", 500);
    }

    const { data: attachment, error: attachmentError } = await supabase
      .from("message_attachments")
      .insert({
        message_id: message.id,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        sort_order: index,
      })
      .select("id, storage_path, preview_path, mime_type, size_bytes, width, height, sort_order")
      .single();

    if (attachmentError || !attachment) {
      return response.error("INTERNAL_ERROR", "첨부 파일 저장에 실패했습니다.", 500);
    }

    attachments.push(attachment as MessageAttachmentRow);
  }

  const messageWithAttachments = {
    ...(message as MessageRow),
    message_attachments: attachments,
  };

  const mappedMessage = await mapMessageRow(supabase, messageWithAttachments);
  return response.success({ message: mappedMessage }, undefined, 201);
}
