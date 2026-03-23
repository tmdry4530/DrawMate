import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";
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

  const adminSupabase = createAdminClient();

  // Canonical direct key: smaller UUID first
  const directKey =
    user.id < targetUserId
      ? `${user.id}:${targetUserId}`
      : `${targetUserId}:${user.id}`;

  let existedBefore = false;
  if (adminSupabase) {
    const { data: existingConversation } = await adminSupabase
      .from("conversations")
      .select("id")
      .eq("direct_key", directKey)
      .maybeSingle();
    existedBefore = !!existingConversation;
  }

  // Create (or reuse) conversation via RPC
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

  const participantClient = adminSupabase ?? supabase;
  const { data: myParticipant } = await participantClient
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId as string)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myParticipant) {
    if (!adminSupabase) {
      return response.error("INTERNAL_ERROR", "대화방 참여자 동기화에 실패했습니다.", 500);
    }

    const { error: participantError } = await adminSupabase
      .from("conversation_participants")
      .upsert(
        [
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: targetUserId },
        ],
        {
          onConflict: "conversation_id,user_id",
          ignoreDuplicates: true,
        }
      );

    if (participantError) {
      return response.error("INTERNAL_ERROR", "대화방 참여자 동기화에 실패했습니다.", 500);
    }
  }

  return response.success(
    { conversationId, reused: existedBefore },
    undefined,
    existedBefore ? 200 : 201
  );
}
