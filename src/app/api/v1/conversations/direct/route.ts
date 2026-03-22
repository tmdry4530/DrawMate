import { createClient } from "@/lib/supabase/server-client";
import * as response from "@/lib/utils/api-response";
import { createDirectConversationSchema } from "@/validators/messaging";

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

  const parsed = createDirectConversationSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return response.validationError("입력값이 올바르지 않습니다.", fieldErrors);
  }

  const { targetUserId, initialMessage, sourcePortfolioId } = parsed.data;

  if (targetUserId === user.id) {
    return response.error("CONFLICT", "자기 자신과 대화할 수 없습니다.", 409);
  }

  // Check if conversation already exists via direct_key
  const directKey =
    user.id < targetUserId
      ? `${user.id}:${targetUserId}`
      : `${targetUserId}:${user.id}`;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("direct_key", directKey)
    .maybeSingle();

  if (existing) {
    // Conversation exists — optionally send initial message
    if (initialMessage?.body) {
      await supabase.from("messages").insert({
        conversation_id: existing.id,
        sender_id: user.id,
        message_type: "text",
        body: initialMessage.body,
        metadata: sourcePortfolioId
          ? { source_portfolio_id: sourcePortfolioId }
          : {},
      });
    }
    return response.success({ conversationId: existing.id, reused: true });
  }

  // Create new conversation via RPC
  const { data: conversationId, error: rpcError } = await supabase.rpc(
    "create_direct_conversation",
    {
      target_user_id: targetUserId,
      initial_message: initialMessage?.body ?? null,
      source_portfolio_id: sourcePortfolioId ?? null,
    }
  );

  if (rpcError || !conversationId) {
    return response.error("INTERNAL_ERROR", "대화방 생성에 실패했습니다.", 500);
  }

  return response.success({ conversationId, reused: false }, undefined, 201);
}
