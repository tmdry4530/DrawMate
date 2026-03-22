import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { toCamelCaseKeys } from "@/server/mappers/case-converter";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return response.unauthorized();
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return response.validationError("multipart/form-data 형식이 필요합니다.");
  }

  const conversationId = formData.get("conversationId");
  if (!conversationId || typeof conversationId !== "string") {
    return response.validationError("conversationId가 필요합니다.");
  }

  const messageId = formData.get("messageId");
  if (!messageId || typeof messageId !== "string") {
    return response.validationError("messageId가 필요합니다.");
  }

  // Verify participant
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return response.forbidden("대화방 참여자가 아닙니다.");
  }

  // Verify message ownership for attachment insert
  const { data: message } = await supabase
    .from("messages")
    .select("id, sender_id, conversation_id")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!message) {
    return response.notFound("메시지를 찾을 수 없습니다.");
  }

  if (message.sender_id !== user.id) {
    return response.forbidden("첨부 파일 추가 권한이 없습니다.");
  }

  const files = formData.getAll("files[]") as File[];
  if (!files || files.length === 0) {
    return response.validationError("업로드할 파일이 없습니다.");
  }

  if (files.length > MAX_FILES) {
    return response.validationError(`최대 ${MAX_FILES}개의 파일만 업로드 가능합니다.`);
  }

  const attachments: unknown[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return response.error(
        "FILE_TYPE_NOT_ALLOWED",
        `허용되지 않는 파일 형식입니다: ${file.type}`,
        422
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return response.error(
        "FILE_TOO_LARGE",
        `파일 크기는 최대 10MB입니다.`,
        422
      );
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${conversationId}/${messageId}/${crypto.randomUUID()}_${i}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return response.error("INTERNAL_ERROR", "파일 업로드에 실패했습니다.", 500);
    }

    // Create attachment record for existing message
    const { data: attachment, error: dbError } = await supabase
      .from("message_attachments")
      .insert({
        message_id: messageId,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        sort_order: i,
      })
      .select("id, storage_path, preview_path, mime_type, size_bytes, width, height, sort_order")
      .single();

    if (dbError || !attachment) {
      return response.error("INTERNAL_ERROR", "첨부 파일 등록에 실패했습니다.", 500);
    }

    attachments.push(toCamelCaseKeys(attachment));
  }

  return response.success({ attachments }, undefined, 201);
}
